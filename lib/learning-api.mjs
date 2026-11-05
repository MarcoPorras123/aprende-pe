import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {catalog,demoPool,selectDemo,normalize,fingerprint} from './learning-content.mjs';
import {aiStatus,generateWithAI,explainWithAI} from './ai-provider.mjs';

const cookieName='aprende_pe_guest';
const pending=new Set();
const pendingTutors=new Set();
function fail(status,message){throw Object.assign(new Error(message),{status});}
const getToken=req=>(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
const tokenId=token=>token&&/^[a-f0-9]{64}$/.test(token)?createHash('sha256').update(token).digest('hex'):null;
function own(data,id,profileId){
  const session=data.learningSessions?.[id];
  if(!session||session.profileId!==profileId)fail(404,'Sesión no encontrada.');
  return session;
}
async function readJson(req){
  const chunks=[];let size=0;
  for await(const c of req){const b=Buffer.from(c);size+=b.length;if(size>24576)fail(413,'El mensaje es demasiado largo.');chunks.push(b);}
  try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||typeof body!=='object'||Array.isArray(body))throw Error();return body;}
  catch(e){if(e.status)throw e;fail(400,'JSON no válido.');}
}
export function validateConfig(raw,ready=false){
  if(!raw||typeof raw!=='object')fail(400,'Falta configurar tu sesión.');
  const domain=String(raw.domain||'');
  if(!Object.hasOwn(catalog,domain))fail(400,'Elige un área de estudio válida.');
  const mode=String(raw.mode||'diagnostico');
  if(!['diagnostico','practica','simulacro'].includes(mode))fail(400,'Modo no válido.');
  const subject=String(raw.subject||'').trim();
  const topic=String(raw.topic||'General').trim();
  if(!subject||subject.length>100||!topic||topic.length>120)fail(400,'Indica un curso o tema más breve.');
  if(domain==='idiomas'&&!catalog.idiomas.subjects.includes(subject))fail(422,'Esta versión trabaja inglés y francés.');
  const source=raw.source==='ai'?'ai':'demo';
  if(source==='ai'&&!ready)fail(503,'La generación con IA aún no está configurada. Elige contenido de muestra.');
  if(source==='demo'&&(!catalog[domain].subjects.includes(subject)||!catalog[domain].topics[subject].includes(topic)))
    fail(422,'Ese tema necesita la generación con IA. En esta vista previa, elige uno de los temas de muestra.');
  const level=domain==='idiomas'?String(raw.level||'auto'):'auto';
  if(!['auto','A1','A2','B1','B2','C1','C2'].includes(level))fail(400,'Nivel no válido.');
  if(source==='demo'&&['B2','C1','C2'].includes(level))fail(422,'La muestra de idiomas cubre A1, A2 y B1. Los demás niveles requieren contenido adicional.');
  const count=Number(raw.count||6);
  if(![3,6,10].includes(count))fail(400,'Elige 3, 6 o 10 preguntas.');
  const threshold=Number(raw.threshold||80);
  if(![70,80,90].includes(threshold))fail(400,'Meta no válida.');
  const minutes=Number(raw.minutes||10);
  if(![5,10,20].includes(minutes))fail(400,'Duración no válida.');
  const target=String(raw.target||'general');
  if(target!=='general')fail(422,'Ese modelo de examen no está incorporado. Puedes preparar una sesión general, sin equivalencia oficial.');
  return {domain,mode,subject,topic,level,count,threshold,minutes,target,source,format:raw.format==='mixed'?'mixed':'choice'};
}
const publicQuestion=q=>({id:q.id,prompt:q.prompt,context:q.context,skill:q.skill,topic:q.topic,level:q.level,
  type:q.type,options:q.type==='choice'?q.options:[],source:q.source});
export function buildSummary(session){
  const outcomes=session.items.map(q=>{
    const a=session.answers.find(x=>x.questionId===q.id);
    return {question:q,answer:a||null,correct:Boolean(a?.correct),skipped:!a||a.skipped};
  });
  const skills=Object.create(null),levels=Object.create(null);
  for(const out of outcomes){
    const row=skills[out.question.skill]??={correct:0,total:0,answered:0};
    row.total++;if(out.correct)row.correct++;if(out.answer&&!out.skipped)row.answered++;
    if(out.question.level){const level=levels[out.question.level]??={correct:0,total:0};level.total++;if(out.correct)level.correct++;}
  }
  const correct=outcomes.filter(o=>o.correct).length, total=outcomes.length, answered=outcomes.filter(o=>!o.skipped).length;
  const percentage=Math.round(correct/total*100);
  const weak=Object.entries(skills).filter(([,s])=>s.correct/s.total*100<session.config.threshold).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total).map(([name])=>name);
  const targetMet=percentage>=session.config.threshold&&answered===total;
  return {correct,total,answered,unanswered:total-answered,percentage,skills,levels,outcomes,weak,targetMet,
    recommendation:targetMet?'Alcanzaste tu meta en esta sesión. Compruébala con preguntas nuevas antes de dar el tema por aprendido.':
      'Conviene reforzar '+(weak.slice(0,2).join(' y ')||'las actividades sin responder')+'. Practica y vuelve a comprobarlo con otra sesión.',
    levelMessage:session.config.domain==='idiomas'?'Esta muestra describe tu desempeño en los ejercicios presentados. No asigna un nivel MCER global ni evalúa expresión oral.':'Resultado orientativo del contenido presentado; no predice una nota oficial ni un ingreso.',
    config:session.config,completedAt:session.completedAt,reason:session.reason,source:session.config.source};
}
function finish(session,reason){
  if(!session.completedAt){session.completedAt=new Date().toISOString();session.reason=reason;session.result=buildSummary(session);}
}
function expire(data,profileId){
  for(const s of Object.values(data.learningSessions||{}))if(s.profileId===profileId&&!s.completedAt&&s.deadlineAt&&Date.now()>=Date.parse(s.deadlineAt))finish(s,'expired');
}
function publicSession(s){
  const result={id:s.id,config:s.config,items:s.items.map(publicQuestion),startedAt:s.startedAt,deadlineAt:s.deadlineAt,
    answers:s.answers.map(({questionId,selectedIndex,input,skipped})=>({questionId,selectedIndex,input,skipped})),completedAt:s.completedAt,
    source:s.config.source,feedbacks:s.config.mode==='practica'?s.feedbacks:{},summary:s.completedAt?s.result:null};
  return result;
}
const historyItem=s=>({id:s.id,config:s.config,completedAt:s.completedAt,percentage:s.result.percentage,correct:s.result.correct,
  total:s.result.total,skills:s.result.skills,weak:s.result.weak,targetMet:s.result.targetMet,reason:s.reason});
const briefFeedback=(q,a)=>({correct:a.correct,skipped:a.skipped,correctIndex:q.correctIndex,answer:q.type==='short'?q.answer:q.options[q.correctIndex],
  explanation:q.explanation,concept:q.concept,nextStep:q.nextStep});
export async function handleLearningApi(req,res,path,store){
  const send=(status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify({...body,serverNow:new Date().toISOString()}));};
  try{
    if(req.method==='GET'&&path==='/api/v3/bootstrap'){
      let token=getToken(req),profileId=tokenId(token),headers={};
      if(!profileId||!store.read(d=>d.profiles[profileId])){
        token=randomBytes(32).toString('hex');profileId=tokenId(token);
        await store.transact(d=>{d.profiles[profileId]={createdAt:new Date().toISOString()};});
        headers['Set-Cookie']=cookieName+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000'+(process.env.COOKIE_SECURE==='1'?'; Secure':'');
      }
      const sessions=await store.transact(d=>{expire(d,profileId);return Object.values(d.learningSessions||{}).filter(s=>s.profileId===profileId);});
      return send(200,{catalog,ai:aiStatus(),history:sessions.filter(s=>s.completedAt).map(historyItem).sort((a,b)=>a.completedAt.localeCompare(b.completedAt)),
        active:sessions.find(s=>!s.completedAt)?publicSession(sessions.find(s=>!s.completedAt)):null,
        poolSize:demoPool.length},headers);
    }
    const profileId=tokenId(getToken(req));
    if(!profileId||!store.read(d=>d.profiles[profileId]))fail(401,'Abre de nuevo la app para recuperar tu perfil de invitado.');
    if(req.method==='POST'){
      const origin=req.headers.origin;
      if(origin&&origin!=='http://'+req.headers.host&&origin!=='https://'+req.headers.host)fail(403,'Origen no permitido.');
      if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Se requiere JSON.');
    }
    if(req.method==='POST'&&path==='/api/v3/sessions'){
      const body=await readJson(req);
      if(typeof body.requestId!=='string'||body.requestId.length>100||!body.requestId)fail(400,'Falta el identificador de la solicitud.');
      const config=validateConfig(body.config,aiStatus().ready);
      const existing=store.read(d=>Object.values(d.learningSessions||{}).find(s=>s.profileId===profileId&&s.creationKey===body.requestId));
      if(existing){
        if(JSON.stringify(existing.config)!==JSON.stringify(config))fail(409,'La solicitud ya se utilizó para otra configuración.');
        return send(200,{session:publicSession(existing)});
      }
      if(pending.has(profileId))fail(409,'Ya estamos preparando una sesión para ti.');
      pending.add(profileId);
      try{
        const old=store.read(d=>Object.values(d.learningSessions||{}).filter(s=>s.profileId===profileId));
        if(old.some(s=>!s.completedAt&&(!s.deadlineAt||Date.now()<Date.parse(s.deadlineAt))))fail(409,'Tienes una sesión pendiente. Continúala o finalízala antes de crear otra.');
        const generated=config.source==='ai'?await generateWithAI(profileId,config,old.flatMap(s=>s.items.map(q=>q.prompt))):null;
        const session=await store.transact(d=>{
          expire(d,profileId);d.learningSessions??={};
          const mine=Object.values(d.learningSessions).filter(s=>s.profileId===profileId);
          if(mine.some(s=>!s.completedAt))fail(409,'Ya hay una sesión en curso.');
          const prior=new Set(mine.flatMap(s=>s.items.map(q=>q.id)));
          const items=generated||selectDemo(config,[...prior]);
          if(items.some(q=>prior.has(fingerprint(q))))fail(422,'Encontramos una pregunta repetida. Solicita otra selección.');
          if(generated){
            const priorPrompts=new Set(mine.flatMap(s=>s.items.map(q=>normalize(q.prompt))));
            if(items.some(q=>priorPrompts.has(normalize(q.prompt))))fail(422,'Una pregunta generada ya estaba en tu historial. Solicita otra selección.');
          }
          const session={id:randomUUID(),profileId,version:3,config,items,answers:[],feedbacks:{},receipts:{},tutorMessages:[],
            creationKey:body.requestId,startedAt:new Date().toISOString(),deadlineAt:config.mode==='simulacro'?new Date(Date.now()+config.minutes*60000).toISOString():null,completedAt:null};
          d.learningSessions[session.id]=session;return session;
        });
        return send(201,{session:publicSession(session)});
      }finally{pending.delete(profileId);}
    }
    const match=path.match(/^\/api\/v3\/sessions\/([a-f0-9-]+)(?:\/(answers|finish|tutor))?$/);
    if(!match)fail(404,'Ruta no encontrada.');
    const [,id,operation]=match;
    if(req.method==='GET'&&!operation){
      const s=await store.transact(d=>{expire(d,profileId);return own(d,id,profileId);});
      return send(200,{session:publicSession(s)});
    }
    if(req.method!=='POST')fail(405,'Método no permitido.');
    const body=await readJson(req);
    if(operation==='tutor'){
      const s=store.read(d=>own(d,id,profileId));
      if(!s.completedAt&&s.config.mode!=='practica')fail(403,'Las explicaciones se habilitan al terminar esta evaluación.');
      const q=s.items.find(q=>q.id===body.questionId),a=s.answers.find(a=>a.questionId===body.questionId);
      if(!q||(!s.completedAt&&!a))fail(403,'Responde primero para consultar la explicación.');
      if(typeof body.message!=='string'||!body.message.trim()||body.message.length>1200)fail(400,'Escribe una pregunta de hasta 1.200 caracteres.');
      if(pendingTutors.has(profileId))fail(409,'Hay una explicación en curso.');
      pendingTutors.add(profileId);
      try{
        let text,source='demo';
        if(aiStatus().ready&&s.config.source==='ai'){text=await explainWithAI(profileId,q,a,body.message);source='ai';}
        else{
          const m=normalize(body.message);
          text=m.includes('practic')?q.nextStep+' Puedes elegir «Practicar este tema» en tus resultados.':
            m.includes('concept')||m.includes('formula')?'La idea clave es '+q.concept+'. '+q.explanation:
            q.explanation+' Para comprobar que lo entendiste: '+q.nextStep;
          if(!/sencill|explic|concept|formula|practic|ejemplo|por que/.test(m))text='Esta guía local puede mostrarte la solución y el concepto del ejercicio. La conversación libre requiere activar la IA. '+q.explanation;
        }
        await store.transact(d=>{const ownS=own(d,id,profileId);ownS.tutorMessages.push({questionId:q.id,message:body.message,text,source,at:new Date().toISOString()});});
        return send(200,{text,source});
      }finally{pendingTutors.delete(profileId);}
    }
    const session=await store.transact(d=>{
      const s=own(d,id,profileId);
      if(operation==='finish'){finish(s,s.deadlineAt&&Date.now()>=Date.parse(s.deadlineAt)?'expired':'early');return s;}
      if(operation!=='answers')fail(404,'Operación no encontrada.');
      if(typeof body.requestId!=='string'||!body.requestId||body.requestId.length>100)fail(400,'Falta el identificador de respuesta.');
      const payload=JSON.stringify({questionId:body.questionId,selectedIndex:body.selectedIndex??null,input:body.input??null,skip:body.skip===true});
      if(Object.hasOwn(s.receipts,body.requestId)){
        if(s.receipts[body.requestId]!==payload)fail(409,'Ese identificador ya pertenece a otra respuesta.');
        return s;
      }
      if(s.completedAt)fail(409,'Esta sesión ya terminó. Abre su resultado.');
      if(s.deadlineAt&&Date.now()>=Date.parse(s.deadlineAt)){finish(s,'expired');return s;}
      const q=s.items[s.answers.length];
      if(!q||q.id!==body.questionId)fail(409,'La pregunta ya se respondió o no corresponde a este paso. Recupera la sesión.');
      let input=null,selectedIndex=null,correct=false;
      if(body.skip!==true){
        if(q.type==='choice'){
          if(!Number.isInteger(body.selectedIndex)||body.selectedIndex<0||body.selectedIndex>=q.options.length)fail(400,'Selecciona una alternativa.');
          selectedIndex=body.selectedIndex;correct=selectedIndex===q.correctIndex;
        }else{
          if(typeof body.input!=='string'||!body.input.trim()||body.input.length>200)fail(400,'Escribe una respuesta breve.');
          input=body.input.trim();
          const value=input.replace(',','.');
          correct=/^-?\d+(\.\d+)?$/.test(value)&&Number.isFinite(Number(value))&&Math.abs(Number(value)-Number(q.answer))<0.000001;
        }
      }
      const a={questionId:q.id,selectedIndex,input,correct,skipped:body.skip===true,at:new Date().toISOString()};
      s.answers.push(a);Object.defineProperty(s.receipts,body.requestId,{value:payload,writable:true,enumerable:true,configurable:true});
      if(s.config.mode==='practica')s.feedbacks[q.id]=briefFeedback(q,a);
      if(s.answers.length===s.items.length)finish(s,'answered');
      return s;
    });
    return send(200,{session:publicSession(session)});
  }catch(error){return send(error.status||500,{error:error.status?error.message:'No se pudo completar la operación. Tu sesión se conserva.'});}
}
