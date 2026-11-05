import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {createApp} from '../server.mjs';
import {catalog,demoPool,selectDemo,normalize} from '../lib/learning-content.mjs';
import {validateConfig} from '../lib/learning-api.mjs';

const config=(overrides={})=>({domain:'idiomas',subject:'Francés',topic:'General',level:'auto',mode:'diagnostico',count:3,threshold:80,minutes:5,source:'demo',target:'general',format:'choice',...overrides});
async function fixture(t){
 const dir=await mkdtemp(join(tmpdir(),'aprende-v3-test-')),file=join(dir,'data.json');
 let server,base,cookie;
 async function start(){server=await createApp({dataFile:file});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;}
 const close=()=>new Promise(r=>server.close(r));
 await start();
 const bootstrap=await fetch(base+'/api/v3/bootstrap');cookie=bootstrap.headers.get('set-cookie').split(';')[0];
 const call=async(path,body,headers={})=>{
  const r=await fetch(base+'/api/v3'+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,body:await r.json(),headers:r.headers};
 };
 const create=async(overrides={},key=randomUUID())=>call('/sessions',{requestId:key,config:config(overrides)});
 const restart=async mutate=>{await close();if(mutate){const d=JSON.parse(await readFile(file,'utf8'));mutate(d);await writeFile(file,JSON.stringify(d));}await start();};
 t.after(async()=>{await close();await rm(file,{force:true});await rmdir(dir);});
 return {call,create,restart,file};
}
test('la muestra es única, tiene alternativas distintas y respuestas numéricas coherentes',()=>{
 assert.ok(demoPool.length>400);
 assert.equal(new Set(demoPool.map(q=>q.id)).size,demoPool.length);
 for(const q of demoPool){
  assert.equal(new Set(q.options.map(normalize)).size,4,q.prompt);
  assert.ok(q.explanation&&q.nextStep&&q.concept);
  if(q.answer)assert.equal(q.options[q.correctIndex],q.answer,q.prompt);
 }
});
test('selección: alcance, diversidad, agotamiento y exclusión de preguntas vistas',()=>{
 for(const [domain,c] of Object.entries(catalog))for(const subject of c.subjects){
  const selection=selectDemo(config({domain,subject,count:3}));
  assert.equal(selection.length,3);
  assert.ok(selection.every(q=>q.domain===domain&&(subject==='General'||q.subject===subject)));
 }
 const seen=[],c=config({subject:'Inglés',topic:'General',count:3});
 const first=selectDemo(c,seen);seen.push(...first.map(q=>q.id));
 const second=selectDemo(c,seen);assert.ok(second.every(q=>!seen.includes(q.id)));
 assert.throws(()=>selectDemo(c,demoPool.map(q=>q.id)),e=>e.status===422);
 for(const count of [3,6,10]){
  const general=selectDemo(config({domain:'preuni',subject:'General',count}));
  assert.deepEqual(new Set(general.map(q=>q.subject)),new Set(['Matemática','Biología','Historia']));
  const counts=['Matemática','Biología','Historia'].map(s=>general.filter(q=>q.subject===s).length);
  assert.ok(Math.max(...counts)-Math.min(...counts)<=1);
 }
 assert.throws(()=>validateConfig(config({source:'ai'}),false),e=>e.status===503);
 assert.throws(()=>validateConfig(config({target:'UNMSM'})),e=>e.status===422);
 assert.throws(()=>validateConfig(config({subject:'Alemán',source:'ai'}),true),e=>e.status===422);
});
test('diagnóstico: claves ocultas, idempotencia, resultado inmutable y nueva selección',async t=>{
 const f=await fixture(t),key=randomUUID();
 const made=await f.create({},key);assert.equal(made.status,201);
 const s=made.body.session;
 const same=await f.create({},key);assert.equal(same.body.session.id,s.id);
 assert.equal((await f.create({topic:'Lectura'},key)).status,409);
 assert.equal((await f.create()).status,409);
 assert.equal(JSON.stringify(s).includes('correctIndex'),false);
 assert.equal(JSON.stringify(s).includes('explanation'),false);
 assert.equal((await f.call('/sessions/'+s.id+'/tutor',{questionId:s.items[0].id,message:'explica'})).status,403);
 const payload={requestId:randomUUID(),questionId:s.items[0].id,selectedIndex:0};
 let answer=await f.call('/sessions/'+s.id+'/answers',payload);
 assert.equal(answer.status,200);assert.equal(answer.body.session.answers.length,1);
 assert.deepEqual(answer.body.session.feedbacks,{});
 assert.equal(JSON.stringify(answer.body).includes('correctIndex'),false);
 assert.equal((await f.call('/sessions/'+s.id+'/answers',payload)).body.session.answers.length,1);
 assert.equal((await f.call('/sessions/'+s.id+'/answers',{...payload,selectedIndex:1})).status,409);
 assert.equal((await f.call('/sessions/'+s.id+'/answers',{...payload,requestId:randomUUID()})).status,409);
 await f.restart();
 const restored=(await f.call('/bootstrap')).body.active;assert.equal(restored.id,s.id);assert.equal(restored.answers.length,1);
 const done=await f.call('/sessions/'+s.id+'/finish',{});
 const result=done.body.session.summary;assert.equal(result.total,3);assert.equal(result.answered,1);assert.equal(result.unanswered,2);assert.equal(result.targetMet,false);
 assert.equal(result.outcomes.length,3);
 assert.equal(Object.values(result.levels).reduce((sum,row)=>sum+row.total,0),3);
 assert.ok(result.outcomes.every(o=>o.question.explanation));
 assert.deepEqual((await f.call('/sessions/'+s.id+'/finish',{})).body.session.summary,result);
 // A later catalog change cannot alter the saved snapshot or recorded grade.
 const original=demoPool.find(q=>q.id===s.items[0].id),saved=original.correctIndex;
 try{original.correctIndex=(saved+1)%4;assert.deepEqual((await f.call('/sessions/'+s.id)).body.session.summary,result);}finally{original.correctIndex=saved;}
 await f.restart();
 assert.deepEqual((await f.call('/sessions/'+s.id)).body.session.summary,result);
 const next=(await f.create()).body.session;assert.ok(next.items.every(q=>!s.items.some(old=>old.id===q.id)));
 const history=(await f.call('/bootstrap')).body.history;assert.equal(history.length,1);
});
test('práctica: corrección inmediata, respuesta numérica, tutor y meta configurable',async t=>{
 const f=await fixture(t);
 let s=(await f.create({domain:'preuni',subject:'Matemática',topic:'Ecuaciones',mode:'practica',format:'mixed',threshold:90})).body.session;
 assert.equal(s.items[1].type,'short');
 for(let i=0;i<s.items.length;i++){
  const q=s.items[i],stored=JSON.parse(await readFile(f.file,'utf8')).learningSessions[s.id].items[i];
  const payload={requestId:randomUUID(),questionId:q.id,...(q.type==='short'?{input:stored.answer+'.0'}:{selectedIndex:stored.correctIndex})};
  const answer=await f.call('/sessions/'+s.id+'/answers',payload);assert.equal(answer.status,200);s=answer.body.session;
  assert.equal(s.feedbacks[q.id].correct,true);assert.ok(s.feedbacks[q.id].explanation);
  const tutor=await f.call('/sessions/'+s.id+'/tutor',{questionId:q.id,message:'Explícame el concepto'});
  assert.equal(tutor.status,200);assert.equal(tutor.body.source,'demo');assert.ok(tutor.body.text.length>10);
 }
 assert.equal(s.summary.percentage,100);assert.equal(s.summary.targetMet,true);assert.equal(s.summary.config.threshold,90);
});
test('simulacro: servidor controla el vencimiento y conserva respuestas previas',async t=>{
 const f=await fixture(t);
 const s=(await f.create({mode:'simulacro'})).body.session;
 assert.ok(Date.parse(s.deadlineAt)>Date.now());
 await f.call('/sessions/'+s.id+'/answers',{requestId:randomUUID(),questionId:s.items[0].id,selectedIndex:0});
 await f.restart(d=>{d.learningSessions[s.id].deadlineAt=new Date(Date.now()-1000).toISOString();});
 const late=await f.call('/sessions/'+s.id+'/answers',{requestId:randomUUID(),questionId:s.items[1].id,selectedIndex:0});
 assert.equal(late.body.session.summary.reason,'expired');
 assert.equal(late.body.session.summary.answered,1);
 assert.equal(late.body.session.summary.unanswered,2);
 assert.equal((await f.call('/bootstrap')).body.active,null);
});
test('sesiones privadas, origen controlado y entradas inválidas rechazadas',async t=>{
 const f=await fixture(t),s=(await f.create()).body.session;
 assert.equal((await f.call('/sessions/'+s.id,undefined,{Cookie:''})).status,401);
 const outsider=await f.call('/bootstrap',undefined,{Cookie:''});
 const otherCookie=outsider.headers.get('set-cookie').split(';')[0];
 assert.equal((await f.call('/sessions/'+s.id,undefined,{Cookie:otherCookie})).status,404);
 assert.equal((await f.call('/sessions/'+s.id+'/finish',{}, {Origin:'https://untrusted.example'})).status,403);
 assert.equal((await f.call('/sessions/'+s.id+'/answers',{requestId:randomUUID(),questionId:s.items[0].id,selectedIndex:9})).status,400);
 assert.equal((await f.call('/sessions/'+s.id+'/tutor',{questionId:s.items[0].id,message:'explica'})).status,403);
 assert.equal((await f.call('/sessions/'+s.id+'/answers',{requestId:'__proto__',questionId:s.items[0].id,selectedIndex:0})).status,200);
 assert.equal((await f.call('/sessions/'+s.id+'/answers',{requestId:'__proto__',questionId:s.items[0].id,selectedIndex:0})).body.session.answers.length,1);
});
