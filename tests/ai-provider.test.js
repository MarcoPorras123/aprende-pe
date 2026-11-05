import test from 'node:test';
import assert from 'node:assert/strict';
import {generateWithAI,explainWithAI,aiStatus,providerFailure} from '../lib/ai-provider.mjs';

test('adaptador IA: formato estructurado, revisión separada y rechazo de contenido dudoso (servicio simulado)',async()=>{
 const originalFetch=globalThis.fetch;
 const names=['OPENAI_API_KEY','OPENAI_MODEL','AI_ENABLED'],prior=Object.fromEntries(names.map(n=>[n,process.env[n]]));
 const requests=[];
 process.env.OPENAI_API_KEY='test-only-not-a-secret';process.env.OPENAI_MODEL='test-model';process.env.AI_ENABLED='1';
 const items=[1,2,3].map(n=>({prompt:'Resuelve el ejercicio de prueba número '+n,context:'',skill:'Ecuaciones',level:'',explanation:'Solución de prueba',concept:'Álgebra',nextStep:'Practica ecuaciones',options:['A','B','C','D'],correctIndex:0}));
 let accepted=true;
 globalThis.fetch=async(url,options)=>{
  assert.equal(url,'https://api.openai.com/v1/responses');
  const body=JSON.parse(options.body);requests.push(body);
  assert.equal(body.store,false);assert.equal(body.text.format.strict,true);assert.equal(body.model,'test-model');
  const name=body.text.format.name;
  const response=name==='learning_exam'?{questions:items}:name==='learning_review'?{accepted:[accepted,true,true]}:{text:'Explicación de prueba'};
  return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(response)}]}]})};
 };
 try{
  assert.equal(aiStatus().ready,true);
  const config={domain:'preuni',subject:'Matemática',topic:'Ecuaciones',count:3};
  const result=await generateWithAI('test-profile',config,['Pregunta anterior']);
  assert.equal(result.length,3);assert.equal(result[0].source,'ai');assert.equal(requests.length,2);
  assert.deepEqual(JSON.parse(requests[0].input).excluded,['Pregunta anterior']);
  accepted=false;
  await assert.rejects(()=>generateWithAI('test-profile',config,[]),e=>e.status===502);
  assert.equal(await explainWithAI('test-profile',result[0],{selectedIndex:0},'explica'),'Explicación de prueba');
 }finally{globalThis.fetch=originalFetch;for(const n of names)if(prior[n]===undefined)delete process.env[n];else process.env[n]=prior[n];}
});

test('distingue crédito agotado de un límite temporal y no expone mensajes sensibles del proveedor',()=>{
 const quota=providerFailure(429,{error:{code:'credit_balance_exhausted',type:'insufficient_quota',message:'raw-sensitive-test-value'}});
 assert.equal(quota.code,'ai_quota');assert.equal(quota.status,503);
 assert.ok(quota.message.includes('Facturación'));assert.ok(!quota.message.includes('raw-sensitive'));
 const rate=providerFailure(429,{error:{code:'rate_limit_exceeded'}});
 assert.equal(rate.code,'ai_rate_limit');assert.equal(rate.status,429);assert.ok(!rate.message.includes('crédito'));
 assert.equal(providerFailure(401,{}).code,'ai_auth');
 assert.equal(providerFailure(404,{error:{code:'model_not_found'}}).code,'ai_access');
});
