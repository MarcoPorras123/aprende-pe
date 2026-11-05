const root = document.querySelector('#app');
const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const uid = () => crypto.randomUUID();
const modes = {diagnostico:'Evaluarme',practica:'Practicar',simulacro:'Simulacro'};
const domainText = {
  idiomas:['Idiomas','Descubre cómo vas y encuentra tu siguiente paso.','Inglés y francés','language'],
  preuni:['Preuniversitario','Pon a prueba tus conocimientos para lo que viene.','General o por curso','book'],
  universitario:['Universitario','Trabaja ese tema que quieres comprender mejor.','Cursos y temas específicos','cap']
};
const paths = {
 home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
 chat:'M21 11a8 8 0 0 1-8 8H7l-5 3 1-6a8 8 0 1 1 18-5Z',
 chart:'M4 20V10m8 10V4m8 16v-7',book:'M12 5v16m0-16C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1Z',
 arrow:'M5 12h14m-5-5 5 5-5 5',back:'M19 12H5m5-5-5 5 5 5',
 language:'M3 5h12M9 3v2m4 0c-1 6-5 9-10 10m2-7c2 4 5 6 8 7m1 6 4-12 4 12m-6-4h4',
 cap:'m2 8 10-5 10 5-10 5L2 8Zm4 3v6c4 3 8 3 12 0v-6m4-3v8',
 target:'M21 12a9 9 0 1 1-9-9m0 4a5 5 0 1 0 5 5m-5 0 9-9m-5 0h5v5',
 clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
 check:'m5 12 4 4L19 6',close:'m6 6 12 12M6 18 18 6',
 spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z',
 mic:'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V5Zm-3 6v1a6 6 0 0 0 12 0v-1m-6 7v4m-4 0h8',
 flag:'M5 22V3c5-4 9 4 14 0v10c-5 4-9-4-14 0',
 lock:'M6 10h12v11H6V10Zm2 0V6a4 4 0 1 1 8 0v4',
 history:'M3 11a9 9 0 1 1 2 7M3 4v7h7m2-4v6l3 2'
};
const icon=(name,cls='')=>'<svg class="icon '+cls+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[name]||paths.spark)+'"/></svg>';
const state={view:'home',ready:false,busy:false,error:'',catalog:{},ai:{ready:false},history:[],active:null,session:null,config:null,
 step:'mode',chat:[],selected:null,input:'',feedback:null,index:0,tutor:[],tutorBusy:false,tutorError:'',modal:false,targetNotice:false,
 createKey:null,submitKey:null,offset:0,audioUrl:null,recording:false,audioError:'',media:null,recorder:null,audioToken:0};
async function api(path,body) {
 let response;
 try {response=await fetch('/api/v3'+path,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});}
 catch {throw new Error('No se pudo conectar. Tu última respuesta guardada sigue a salvo. Intenta de nuevo.');}
 const data=await response.json();
 if(data.serverNow)state.offset=Date.parse(data.serverNow)-Date.now();
 if(!response.ok)throw new Error(data.error||'No se pudo completar la operación.');
 return data;
}
const button=(label,action,cls='primary',attrs='')=>'<button class="'+cls+'" data-action="'+action+'" '+attrs+'>'+label+'</button>';
const tag=text=>'<span class="tag">'+e(text)+'</span>';
const date=value=>new Intl.DateTimeFormat('es-PE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
const domainLabel=d=>state.catalog[d]?.label||d;
const nav=()=>['home','guide','progress','errors'].map((v,i)=>button(icon(['home','chat','chart','book'][i])+'<span>'+['Inicio','Mi tutor','Mi progreso','Mis errores'][i]+'</span>','nav','nav-item '+(state.view===v?'active':''),'data-view="'+v+'"')).join('');
function render(){
 const title={home:'Tu espacio de aprendizaje',guide:'Una sesión a tu medida',session:'Concéntrate en una pregunta',result:'Cada resultado, un siguiente paso',progress:'Tu progreso',errors:'Tu cuaderno de errores'}[state.view];
 root.innerHTML='<div class="app-shell"><aside class="sidebar"><a class="brand" href="/" aria-label="Aprende Pe, inicio"><span class="brand-mark">p<span>•</span></span><span>aprende<span class="brand-green">pe!</span></span></a><p class="brand-caption">TU SIGUIENTE PASO</p><nav aria-label="Principal">'+nav()+'</nav><div class="sidebar-note">'+icon('spark')+'<p>Un poco de práctica.<br>Una nueva posibilidad.</p></div><div class="profile"><span class="avatar">Tú</span><div><strong>Mi espacio</strong><small>Invitado · este navegador</small></div></div></aside><main class="main"><header class="topbar"><span>'+e(title)+'</span><span class="source-pill"><i></i>'+e(state.ai.ready?(state.ai.verified?'IA conectada':'IA configurada'):'Vista previa · muestra')+'</span></header><div class="content">'+(state.error?'<div role="alert" class="error-banner">'+e(state.error)+button(icon('close'),'dismiss','icon-button','aria-label="Cerrar aviso"')+'</div>':'')+(!state.ready?'<div class="empty"><div class="spinner"></div><h2>Preparando tu espacio…</h2></div>':view())+'</div></main><nav class="mobile-nav" aria-label="Navegación móvil">'+nav()+'</nav></div>'+modal();
 if(state.modal)queueMicrotask(()=>root.querySelector('[data-action="cancel-finish"]')?.focus());
 updateTimer();
}
function view(){return ({home:homeView,guide:guideView,session:sessionView,result:resultView,progress:progressView,errors:errorsView}[state.view]||homeView)();}
function homeView(){
 const last=state.history.at(-1);
 return '<section class="welcome"><div><p class="eyebrow">APRENDE A TU RITMO</p><h1>¿Qué quieres<br>aprender hoy<span class="green">?</span></h1><p class="lede">Descubre dónde estás, practica lo que necesitas<br class="desktop-break"> y prepárate para tu próximo reto.</p></div><div class="welcome-art" aria-hidden="true"><div class="art-orbit"></div><div class="art-sheet"><span class="art-line"></span><span class="art-line short"></span><div class="art-bars"><i></i><i></i><i></i><i></i></div><div class="art-check">'+icon('check')+'</div></div><div class="art-star">✦</div><span class="art-dot"></span></div></section>'+
 (state.active?'<div class="resume-banner"><div>'+icon('history')+'<span><strong>Tu sesión te está esperando</strong><small>'+e(state.active.config.subject)+' · '+e(modes[state.active.config.mode])+' · '+state.active.answers.length+' de '+state.active.items.length+' respondidas</small></span></div>'+button('Continuar '+icon('arrow'),'resume','primary')+'</div>':'')+
 '<section aria-labelledby="areas-title"><div class="section-title"><h2 id="areas-title">Elige tu área</h2><span>'+(state.preferredMode?'Para '+e(modes[state.preferredMode]).toLowerCase()+', elige tu área':'Un punto de partida para cada objetivo')+'</span></div><div class="domain-grid">'+Object.entries(domainText).map(([id,d],i)=>'<button class="domain-card domain-'+i+'" data-action="domain" data-domain="'+id+'"><span class="domain-icon">'+icon(d[3])+'</span><h3>'+d[0]+'</h3><p>'+d[1]+'</p><div class="domain-bottom"><span>'+d[2]+'</span>'+icon('arrow')+'</div></button>').join('')+'</div></section>'+
 '<div class="home-bottom"><section><div class="section-title"><h2>Tres formas de avanzar</h2></div><div class="mode-list">'+[['diagnostico','target','Descubre cómo vas','Una evaluación para reconocer fortalezas y temas por reforzar.'],['practica','chat','Entiende y practica','Concéntrate en un tema, con explicaciones en cada paso.'],['simulacro','clock','Prepárate para el reto','Pon tus conocimientos a prueba con tiempo y revisión final.']].map(([mode,ic,title,text],i)=>'<button class="mode-row" data-action="quick-mode" data-mode="'+mode+'"><span class="mode-number">0'+(i+1)+'</span><div><h3>'+title+'</h3><p>'+text+'</p></div>'+icon(ic)+'</button>').join('')+'</div></section><section class="progress-peek"><div class="section-title"><h2>Tu camino, paso a paso</h2>'+icon('chart')+'</div>'+(last?'<div class="peek-number">'+state.history.length+'<span>sesiones completadas</span></div><p>Última sesión: <strong>'+e(last.config.subject)+'</strong></p><div class="last-score"><strong>'+last.percentage+'%</strong><span>'+last.correct+' de '+last.total+' respuestas correctas</span></div>'+button('Ver mi progreso '+icon('arrow'),'nav','text-button','data-view="progress"'):'<div class="empty-chart" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><span>'+icon('flag')+'</span></div><h3>Todo empieza con una sesión</h3><p>Aquí verás tus resultados y los temas que puedes seguir trabajando.</p><span class="small muted">Tu progreso se guarda en este navegador.</span>')+'</section></div><p class="provenance">'+icon('spark')+' '+e(state.ai.ready?'La generación con IA está configurada. Requiere crédito disponible en la cuenta de OpenAI; también puedes elegir ejercicios de muestra.':'Esta vista previa usa ejercicios de muestra y variantes locales. La generación libre de temas requiere activar la IA.')+'</p>';
}
function begin(domain,mode){
 if(state.active){state.error='Continúa o finaliza tu sesión pendiente antes de abrir otra.';state.view='home';render();return;}
 cleanupAudio();state.view='guide';state.error='';state.chat=[];state.targetNotice=false;
 state.config={domain,mode:mode||'diagnostico',subject:'',topic:'General',level:'auto',count:6,threshold:80,minutes:10,target:'general',source:state.ai.ready?'ai':'demo',format:'choice'};
 state.step=mode?'subject':'mode';state.createKey=uid();render();window.scrollTo({top:0});
}
function currentPrompt(){
 const c=state.config;
 return {mode:'¿Qué te gustaría hacer en '+domainLabel(c.domain).toLowerCase()+'?',
 subject:c.domain==='idiomas'?'¿Qué idioma vamos a trabajar?':'¿En qué curso quieres concentrarte?',
 level:'¿Quieres explorar varios niveles o practicar uno en particular?',
 topic:c.mode==='practica'?'¿Qué tema quieres practicar?':'¿Prefieres un tema específico o una selección general?',
 target:'¿Quieres un simulacro general o buscas un modelo de examen específico?',
 review:'Ya tenemos un punto de partida. Revisa tu sesión y empezamos.'}[state.step];
}
function choices(){
 const c=state.config;
 if(state.step==='mode')return [['diagnostico','Evaluarme','Reconocer fortalezas y dificultades'],['practica','Practicar un tema','Aprender con corrección inmediata'],['simulacro','Hacer un simulacro','Resolver con tiempo y revisión final']];
 if(state.step==='subject')return state.catalog[c.domain].subjects.map(x=>[x,x,x==='General'?'Selección de cursos de la muestra':'']);
 if(state.step==='level')return [['auto','No conozco mi nivel','Explorar ejercicios de varios niveles'],...['A1','A2','B1',...(c.source==='ai'?['B2','C1','C2']:[])].map(x=>[x,x,'Nivel de los ejercicios'])];
 if(state.step==='topic')return (state.catalog[c.domain].topics[c.subject]||['General']).map(x=>[x,x,x==='General'?'Una selección de los temas disponibles':'']);
 if(state.step==='target')return [['general','Simulacro general','Sin equivalencia con un examen oficial'],['specific','Universidad o examen específico','Ver disponibilidad de modelos']];
 return [];
}
function choose(value,label){
 const c=state.config,old=state.step;state.error='';state.targetNotice=false;
 if(old==='target'&&value==='specific'){state.targetNotice=true;render();return;}
 state.chat.push({role:'assistant',text:currentPrompt()},{role:'user',text:label||value});
 if(old==='mode'){c.mode=value;state.step='subject';}
 else if(old==='subject'){c.subject=value;state.step=c.domain==='idiomas'?'level':'topic';}
 else if(old==='level'){c.level=value;state.step='topic';}
 else if(old==='topic'){c.topic=value;state.step=c.mode==='simulacro'?'target':'review';}
 else if(old==='target'){c.target=value;state.step='review';}
 state.createKey=uid();render();
 root.querySelector('.current-prompt')?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function guideView(){
 if(!state.config)return '<div class="page-heading"><p class="eyebrow">TU GUÍA DE ESTUDIO</p><h1>Empecemos por tu objetivo.</h1><p class="lede">Elige un área. Después te ayudaré a configurar tu sesión.</p></div><div class="domain-grid">'+Object.entries(domainText).map(([id,d],i)=>button('<span class="domain-icon">'+icon(d[3])+'</span><h3>'+d[0]+'</h3><p>'+d[1]+'</p><div class="domain-bottom"><span>'+d[2]+'</span>'+icon('arrow')+'</div>','domain','domain-card domain-'+i,'data-domain="'+id+'"')).join('')+'</div>';
 const c=state.config;
 return '<div class="page-heading">'+button(icon('back')+' Cambiar área','home','text-button')+'<p class="eyebrow">'+e(domainLabel(c.domain))+'</p><h1>Tu siguiente paso,<br>a tu medida.</h1><p class="lede">Cuéntame qué quieres trabajar. Lo organizamos juntos.</p></div><div class="guide-layout"><section class="chat-panel"><div class="tutor-heading"><span class="tutor-avatar">'+icon('spark')+'</span><div><strong>Tu guía de estudio</strong><small>'+e(c.source==='ai'?'Configuración guiada · generación con IA':'Configuración guiada · contenido de muestra')+'</small></div></div><div class="chat-thread"><div class="bubble assistant">Empecemos por tu objetivo. Después resolverás una actividad y revisaremos qué te conviene practicar.</div>'+state.chat.map(m=>'<div class="bubble '+m.role+'">'+e(m.text)+'</div>').join('')+'<div class="bubble assistant current-prompt">'+e(currentPrompt())+'</div>'+(state.targetNotice?'<div class="notice">Todavía no se han incorporado modelos oficiales de universidades ni de certificaciones. Puedes probar un simulacro general. No se presentará como equivalente a un examen real.</div>':'')+
 (state.step==='review'?reviewSettings():'<div class="choices">'+choices().map(([value,label,sub])=>button('<strong>'+e(label)+'</strong>'+(sub?'<small>'+e(sub)+'</small>':''),'choose','choice','data-value="'+e(value)+'" data-label="'+e(label)+'"')).join('')+'</div>')+'</div>'+
 (state.step!=='review'?'<form id="guide-form" class="chat-compose"><label class="sr-only" for="guide-input">Tu respuesta</label><input id="guide-input" autocomplete="off" maxlength="120" placeholder="'+(state.ai.ready&&['subject','topic'].includes(state.step)?'Elige una opción o escribe tu tema…':'También puedes escribir una opción…')+'"><button aria-label="Enviar respuesta" class="send-button">'+icon('arrow')+'</button></form>':'')+'</section><aside class="plan-card"><p class="eyebrow">TU SESIÓN</p><h2>Un objetivo claro.</h2><dl><div><dt>Área</dt><dd>'+e(domainLabel(c.domain))+'</dd></div><div><dt>Actividad</dt><dd>'+e(modes[c.mode])+'</dd></div><div><dt>Curso</dt><dd>'+e(c.subject||'Por elegir')+'</dd></div><div><dt>Tema</dt><dd>'+e(c.topic)+'</dd></div></dl><div class="plan-feature">'+icon('check')+' Preguntas nuevas para ti</div><div class="plan-feature">'+icon('check')+' Explicaciones y próximos pasos</div><div class="plan-feature">'+icon('check')+' Historial de tus resultados</div><p class="small muted">'+(c.mode==='practica'?'Verás la corrección al responder cada pregunta.':'Revisarás las soluciones al finalizar la sesión.')+'</p><div class="scope-note">'+(c.domain==='idiomas'?'La muestra trabaja lectura, gramática y vocabulario. El resultado no certifica tu nivel de idioma.':'La selección cubre los temas disponibles de la muestra; no representa un temario oficial completo.')+'</div></aside></div>';
}
function selectField(label,key,options){
 return '<label class="field"><span>'+label+'</span><select data-config="'+key+'">'+options.map(([v,l])=>'<option value="'+e(v)+'" '+(String(state.config[key])===String(v)?'selected':'')+'>'+e(l)+'</option>').join('')+'</select></label>';
}
function reviewSettings(){
 const c=state.config;
 return '<div class="settings-grid">'+selectField('Preguntas','count',[[3,'3 · recorrido breve'],[6,'6 · sesión corta'],[10,'10 · más práctica']])+selectField('Mi meta para esta sesión','threshold',[[70,'70%'],[80,'80%'],[90,'90%']])+
 (c.mode==='simulacro'?selectField('Tiempo disponible','minutes',[[5,'5 minutos'],[10,'10 minutos'],[20,'20 minutos']]):'')+
 (c.domain!=='idiomas'&&c.source==='demo'?selectField('Respuestas','format',[['choice','Alternativas'],['mixed','Alternativas y respuesta numérica']]):'')+
 (state.ai.ready?selectField('Contenido','source',[['ai','Generación con IA'],['demo','Ejercicios de muestra']]):'')+'</div><p class="small muted">La meta es personalizable. Alcanzarla en una sesión no desbloquea automáticamente un nivel ni demuestra dominio completo.</p>'+button(state.busy?'<span class="spinner small-spinner"></span> Preparando tu sesión…':'Empezar sesión '+icon('arrow'),'start','primary wide',state.busy?'disabled':'')+button('Volver a configurar','reset-config','text-button wide',state.busy?'disabled':'');
}
function acceptSession(session,showFeedback=false){
 cleanupAudio();state.session=session;state.active=session.completedAt?null:session;state.selected=null;state.input='';state.submitKey=null;state.tutor=[];state.tutorError='';state.feedback=null;
 const last=session.answers.at(-1);
 if(showFeedback&&session.config.mode==='practica'&&last&&session.feedbacks[last.questionId]){
   state.index=session.items.findIndex(q=>q.id===last.questionId);state.feedback=session.feedbacks[last.questionId];state.view='session';
 }else if(session.completedAt){state.view='result';}
 else {state.index=session.answers.length;state.view='session';}
}
function currentQuestion(){return state.session?.items[state.index];}
function sessionView(){
 const s=state.session,q=currentQuestion();if(!s||!q)return homeView();
 const f=state.feedback,answered=Boolean(f),progress=Math.round(s.answers.length/s.items.length*100);
 return '<div class="session-heading">'+button(icon('back')+' Guardar y salir','home','text-button')+'<span>'+e(modes[s.config.mode])+' / '+e(s.config.subject)+'</span>'+(s.deadlineAt?'<span class="timer">'+icon('clock')+'<strong id="timer">--:--</strong></span>':tag('A tu ritmo'))+'</div><div class="session-progress"><span>Pregunta '+(state.index+1)+' de '+s.items.length+'</span><span>'+s.answers.length+(s.answers.length===1?' respondida':' respondidas')+'</span><div><i style="width:'+progress+'%"></i></div></div><div class="exercise-layout"><section class="question-card"><div class="question-tags">'+tag(q.skill)+(q.level?tag(q.level):'')+tag(q.source==='ai'?'Generada con IA':'Ejercicio de muestra')+'</div>'+(q.context?'<div class="reading">'+e(q.context)+'</div>':'')+'<h1 class="question-title">'+e(q.prompt)+'</h1>'+
 (q.type==='choice'?'<div class="answers" role="radiogroup" aria-label="Alternativas">'+q.options.map((o,i)=>'<button role="radio" aria-checked="'+(answered?s.answers.find(a=>a.questionId===q.id)?.selectedIndex===i:state.selected===i)+'" class="answer '+(state.selected===i?'selected ':'')+(f&&f.correctIndex===i?'correct ':'')+(f&&!f.correct&&s.answers.find(a=>a.questionId===q.id)?.selectedIndex===i?'incorrect':'')+'" data-action="answer" data-index="'+i+'" '+(answered||state.busy?'disabled':'')+'><span class="option-letter">'+String.fromCharCode(65+i)+'</span><span>'+e(o)+'</span><span class="option-indicator">'+(f&&f.correctIndex===i?icon('check'):'')+'</span></button>').join('')+'</div>':'<label class="field numeric-answer"><span>Escribe el resultado numérico</span><input id="numeric-answer" inputmode="decimal" maxlength="200" placeholder="Por ejemplo: 12,5" value="'+e(answered?s.answers.find(a=>a.questionId===q.id)?.input:state.input)+'" '+(answered||state.busy?'disabled':'')+'><small>Admite punto o coma decimal.</small></label>')+
 (f?'<div class="feedback '+(f.correct?'positive':'reinforce')+'" role="status"><h3>'+icon(f.correct?'check':'book')+' '+(f.correct?'¡Bien resuelto!':f.skipped?'Repasemos esta pregunta':'Una oportunidad para entenderlo')+'</h3><p><strong>Respuesta: '+e(f.answer)+'</strong></p><p>'+e(f.explanation)+'</p><span class="small">'+e(f.concept)+'</span></div>':'')+
 '<div class="question-actions">'+(f?button(s.completedAt?'Ver mis resultados '+icon('arrow'):'Siguiente pregunta '+icon('arrow'),'next','primary'):button(state.busy?'Guardando…':'Confirmar respuesta '+icon('arrow'),'submit','primary',state.busy||(q.type==='choice'?state.selected===null:!state.input.trim())?'disabled':'')+button('Omitir','skip','text-button',state.busy?'disabled':''))+'</div></section><aside class="exercise-aside">'+(f?tutorPanel(q):'<div class="focus-card"><span class="focus-icon">'+icon(s.config.mode==='practica'?'chat':'target')+'</span><h2>'+e(s.config.mode==='practica'?'Aprender, paso a paso.':'Este momento es para ti.')+'</h2><p>'+e(s.config.mode==='practica'?'Responde primero. Después podrás revisar el concepto y consultar la guía.':'Resuelve con lo que sabes. Al terminar verás las soluciones y los temas que puedes reforzar.')+'</p><div class="scope-note">'+icon('lock')+' '+(s.config.mode==='practica'?'La corrección aparece después de responder.':'Las respuestas se muestran al finalizar.')+'</div></div>')+
 (s.config.domain==='idiomas'?voicePanel():'')+(!s.completedAt?button('Finalizar esta sesión','ask-finish','text-button wide',state.busy?'disabled':''):'')+'</aside></div>';
}
function tutorPanel(){
 return '<section class="tutor-panel"><div class="tutor-heading"><span class="tutor-avatar">'+icon('spark')+'</span><div><strong>Entendámoslo juntos</strong><small>'+e(state.session.config.source==='ai'?'Tutor con IA':'Guía local de la muestra')+'</small></div></div><p>Revisa la idea que hay detrás de tu respuesta.</p><div class="tutor-shortcuts">'+['Explícame el concepto','¿Qué debo practicar?'].map(text=>button(e(text),'tutor-shortcut','chip','data-message="'+e(text)+'" '+(state.tutorBusy?'disabled':''))).join('')+'</div><div class="tutor-messages">'+state.tutor.map(m=>'<div class="bubble '+m.role+'">'+e(m.text)+'</div>').join('')+'</div>'+(state.tutorBusy?'<p role="status" class="small">Preparando una explicación…</p>':'')+(state.tutorError?'<p role="alert" class="small error-text">'+e(state.tutorError)+'</p>':'')+'<form id="tutor-form" class="chat-compose"><label class="sr-only" for="tutor-input">Consulta sobre el ejercicio</label><input id="tutor-input" maxlength="1200" placeholder="Pregunta sobre este ejercicio…" '+(state.tutorBusy?'disabled':'')+'><button class="send-button" aria-label="Consultar guía" '+(state.tutorBusy?'disabled':'')+'>'+icon('arrow')+'</button></form></section>';
}
function voicePanel(){
 return '<section class="voice-panel"><h3>'+icon('mic')+' Practica en voz alta</h3><p>Grábate y escúchate. Este ensayo se queda en tu navegador y no se califica.</p>'+button(state.recording?'Detener grabación':'Grabar mi voz','record','secondary wide')+(state.audioUrl?'<audio controls src="'+state.audioUrl+'" aria-label="Tu ensayo de voz"></audio>':'')+(state.audioError?'<p class="small error-text" role="alert">'+e(state.audioError)+'</p>':'')+'<small class="muted">Máximo 60 segundos · se descarta al cambiar de pregunta.</small></section>';
}
function resultView(){
 const s=state.session,r=s?.summary;if(!r)return homeView();
 return '<div class="page-heading"><p class="eyebrow">SESIÓN COMPLETADA · '+e(s.config.subject)+'</p><h1>Ya tienes un siguiente paso.</h1><p class="lede">Una mirada a lo que resolviste y lo que puedes seguir trabajando.</p></div><section class="result-overview"><div class="score-ring" style="--score:'+r.percentage+'"><div><strong>'+r.percentage+'<span>%</span></strong><small>de aciertos</small></div></div><div class="result-copy"><div class="question-tags">'+tag(modes[s.config.mode])+tag(s.config.source==='ai'?'Generación con IA':'Contenido de muestra')+'</div><h2>'+e(r.targetMet?'Alcanzaste tu meta en esta sesión.':'Cada intento te da información.')+'</h2><p>'+r.correct+' de '+r.total+' respuestas correctas · '+r.unanswered+' sin responder · meta '+s.config.threshold+'%</p><p>'+e(r.recommendation)+'</p>'+(r.reason==='expired'?'<p class="notice">El tiempo terminó. Las preguntas pendientes cuentan como no respondidas.</p>':r.reason==='early'?'<p class="small muted">Finalizaste antes de completar todas las preguntas.</p>':'')+'</div></section><div class="result-columns"><section class="panel"><div class="section-title"><h2>Así te fue por tema</h2>'+icon('chart')+'</div>'+skillBars(r.skills)+levelEvidence(r)+'<p class="small muted">'+e(r.levelMessage)+'</p></section><section class="next-step"><p class="eyebrow">¿QUÉ SIGUE?</p><h2>'+e(r.weak.length?'Convierte una dificultad en práctica.':'Comprueba lo aprendido con algo nuevo.')+'</h2><p>'+e(r.weak.length?'Empieza por '+r.weak[0]+'. Tendrás explicaciones después de cada respuesta.':'Una nueva selección te ayudará a comprobar si puedes sostener este resultado.')+'</p>'+button('Practicar '+e(r.weak[0]||'este tema')+' '+icon('arrow'),'practice-weak','primary wide')+button('Evaluarme con preguntas nuevas','repeat','secondary wide')+'</section></div><div class="section-title review-heading"><h2>Revisa tus respuestas</h2><span>Conceptos, soluciones y próximos pasos</span></div><div class="review-list">'+r.outcomes.map((o,i)=>reviewRow(o,i)).join('')+'</div><div class="result-footer">'+button('Ver mi progreso '+icon('arrow'),'nav','text-button','data-view="progress"')+button('Elegir otra área','home','secondary')+'</div>';
}
function levelEvidence(result){
 const rows=Object.entries(result.levels||{}).sort(([a],[b])=>a.localeCompare(b));
 if(!rows.length)return '';
 return '<div class="level-evidence"><h3>Por nivel de los ejercicios</h3><div>'+rows.map(([level,s])=>'<span>'+e(level)+' <strong>'+s.correct+'/'+s.total+'</strong></span>').join('')+'</div><p>Son aciertos de esta muestra; con tan pocas preguntas no se determina un nivel global.</p></div>';
}
function skillBars(skills){
 return Object.entries(skills).map(([name,s])=>{const pct=Math.round(s.correct/s.total*100);return '<div class="skill-row"><div><strong>'+e(name)+'</strong><span>'+s.correct+'/'+s.total+' · '+pct+'%</span></div><div class="skill-track"><i style="width:'+pct+'%"></i></div></div>';}).join('');
}
function reviewRow(o,i){
 const q=o.question,a=o.answer,correct=q.type==='short'?q.answer:q.options[q.correctIndex];
 const given=o.skipped?'Sin responder':q.type==='short'?a.input:q.options[a.selectedIndex];
 return '<details class="review-row"><summary><span class="review-status '+(o.correct?'pass':'miss')+'">'+icon(o.correct?'check':'book')+'</span><span><small>Pregunta '+(i+1)+' · '+e(q.skill)+'</small><strong>'+e(q.prompt)+'</strong></span><span class="review-label">'+(o.correct?'Correcta':o.skipped?'Omitida':'Por reforzar')+'</span></summary><div class="review-body">'+(q.context?'<p class="reading">'+e(q.context)+'</p>':'')+'<p><span class="muted">Tu respuesta:</span> '+e(given)+'</p><p><strong>Respuesta correcta: '+e(correct)+'</strong></p><p>'+e(q.explanation)+'</p><div class="concept-box"><strong>Concepto · '+e(q.concept)+'</strong><p>'+e(q.nextStep)+'</p></div>'+button('Practicar este tema '+icon('arrow'),'practice-item','text-button','data-index="'+i+'"')+'</div></details>';
}
function historyRows(rows){
 return rows.slice().reverse().map(s=>'<button class="history-row" data-action="open-session" data-id="'+s.id+'"><span class="history-icon">'+icon(domainText[s.config.domain]?.[3]||'book')+'</span><div><strong>'+e(s.config.subject)+' <span class="muted">· '+e(modes[s.config.mode])+'</span></strong><small>'+e(s.config.topic)+' · '+e(date(s.completedAt))+'</small></div><span class="history-score">'+s.percentage+'%</span>'+icon('arrow')+'</button>').join('');
}
function progressView(){
 const h=state.history,total=h.reduce((n,s)=>n+s.total,0),correct=h.reduce((n,s)=>n+s.correct,0),skills=Object.create(null);
 for(const s of h)for(const [name,row]of Object.entries(s.skills)){const key=s.config.subject+' · '+name;skills[key]??={correct:0,total:0};skills[key].correct+=row.correct;skills[key].total+=row.total;}
 return '<div class="page-heading"><p class="eyebrow">TU HISTORIAL</p><h1>Cada sesión cuenta.</h1><p class="lede">Mira lo que has trabajado y decide dónde poner tu atención.</p></div>'+(h.length?'<div class="stats-grid"><div><span>Sesiones completadas</span><strong>'+h.length+'</strong></div><div><span>Preguntas revisadas</span><strong>'+total+'</strong></div><div><span>Respuestas correctas</span><strong>'+correct+'</strong></div></div><div class="result-columns"><section class="panel"><h2>Resultados por tema</h2>'+skillBars(skills)+'<p class="small muted">Acumulado de tus ejercicios. Las sesiones pueden variar en dificultad y no son mediciones equivalentes de nivel.</p></section><section><div class="section-title"><h2>Tus sesiones</h2></div><div class="history-list">'+historyRows(h)+'</div></section></div>':emptyState('Tu historia empieza aquí','Completa una sesión para ver tus resultados y los temas que puedes reforzar.','Empezar una sesión'));
}
function errorsView(){
 const h=state.history.filter(s=>s.correct<s.total);
 return '<div class="page-heading"><p class="eyebrow">APRENDER DE LOS INTENTOS</p><h1>Tu cuaderno de errores.</h1><p class="lede">Vuelve a las preguntas que necesitan otra mirada.</p></div>'+(h.length?'<div class="panel"><p>Abre una sesión para revisar las soluciones y practicar el tema de cada pregunta.</p><div class="history-list">'+historyRows(h)+'</div></div>':emptyState('Nada pendiente por aquí','Las sesiones con respuestas por reforzar aparecerán en este espacio.','Elegir un área'));
}
function emptyState(title,body,label){return '<div class="empty panel"><span class="empty-icon">'+icon('book')+'</span><h2>'+title+'</h2><p>'+body+'</p>'+button(label+' '+icon('arrow'),'home','primary')+'</div>';}
function modal(){
 return state.modal?'<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><span class="focus-icon">'+icon('flag')+'</span><h2 id="modal-title">¿Finalizar esta sesión?</h2><p>Se guardará tu resultado. Las preguntas pendientes contarán como no respondidas y podrás revisar todas las soluciones.</p><div class="modal-actions">'+button('Seguir respondiendo','cancel-finish','secondary')+button('Finalizar y ver resultados','finish','primary',state.busy?'disabled':'')+'</div></section></div>':'';
}
async function refresh(){
 const b=await api('/bootstrap');state.catalog=b.catalog;state.ai=b.ai;state.history=b.history;state.active=b.active;state.ready=true;
}
async function start(){
 state.busy=true;state.error='';render();
 try{const d=await api('/sessions',{requestId:state.createKey,config:state.config});acceptSession(d.session);}
 catch(err){state.error=err.message;}
 finally{state.busy=false;render();window.scrollTo({top:0,behavior:'smooth'});}
}
async function submit(skip=false){
 const s=state.session,q=currentQuestion();state.busy=true;state.error='';state.submitKey??=uid();render();
 try{
   const d=await api('/sessions/'+s.id+'/answers',{requestId:state.submitKey,questionId:q.id,selectedIndex:q.type==='choice'?state.selected:null,input:q.type==='short'?state.input:null,skip});
   acceptSession(d.session,true);if(d.session.completedAt)await refresh();
 }catch(err){
   state.error=err.message;
   try{const d=await api('/sessions/'+s.id);if(d.session.answers.length>s.answers.length||d.session.completedAt){acceptSession(d.session,true);state.error='';await refresh();}}catch{}
 }finally{state.busy=false;render();}
}
async function finish(){
 state.modal=false;state.busy=true;render();
 try{const d=await api('/sessions/'+state.session.id+'/finish',{});acceptSession(d.session);await refresh();}
 catch(err){state.error=err.message;}
 finally{state.busy=false;render();window.scrollTo({top:0,behavior:'smooth'});}
}
async function openSession(id,resume=false){
 state.busy=true;state.error='';render();
 try{const d=await api('/sessions/'+id);acceptSession(d.session,resume&&d.session.config.mode==='practica');}
 catch(err){state.error=err.message;}
 finally{state.busy=false;render();window.scrollTo({top:0});}
}
async function askTutor(message){
 if(!message.trim()||state.tutorBusy)return;
 const sid=state.session.id,qid=currentQuestion().id;
 state.tutor.push({role:'user',text:message});state.tutorBusy=true;state.tutorError='';render();
 try{const d=await api('/sessions/'+sid+'/tutor',{questionId:qid,message});if(state.session?.id===sid&&currentQuestion()?.id===qid)state.tutor.push({role:'assistant',text:d.text});}
 catch(err){if(state.session?.id===sid&&currentQuestion()?.id===qid)state.tutorError=err.message;}
 finally{state.tutorBusy=false;render();}
}
function practiceFrom(item){
 const old=state.session.config;begin(old.domain,'practica');
 if(state.view!=='guide')return;
 state.config={...old,mode:'practica',subject:item.subject||old.subject,topic:item.topic||old.topic,count:3,level:old.domain==='idiomas'?item.level||'auto':'auto'};
 state.step='review';state.chat=[];render();window.scrollTo({top:0});
}
function cleanupAudio(){
 state.audioToken++;
 if(state.recorder&&state.recorder.state!=='inactive')state.recorder.stop();
 state.media?.getTracks().forEach(t=>t.stop());state.media=null;state.recorder=null;state.recording=false;
 if(state.audioUrl)URL.revokeObjectURL(state.audioUrl);state.audioUrl=null;state.audioError='';
}
async function record(){
 if(state.recording){state.recorder.stop();return;}
 cleanupAudio();const token=state.audioToken;
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){state.audioError='Este navegador no permite grabar audio aquí.';render();return;}
 try{
   const media=await navigator.mediaDevices.getUserMedia({audio:true});
   if(token!==state.audioToken){media.getTracks().forEach(t=>t.stop());return;}
   state.media=media;const recorder=new MediaRecorder(media),chunks=[];state.recorder=recorder;
   recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   recorder.onstop=()=>{media.getTracks().forEach(t=>t.stop());if(token!==state.audioToken)return;state.recording=false;state.audioUrl=URL.createObjectURL(new Blob(chunks,{type:recorder.mimeType}));render();};
   recorder.onerror=()=>{cleanupAudio();state.audioError='No se pudo completar la grabación. Intenta de nuevo.';render();};
   recorder.start();state.recording=true;render();setTimeout(()=>{if(token===state.audioToken&&recorder.state==='recording')recorder.stop();},60000);
 }catch{state.audioError='No se pudo acceder al micrófono. Puedes continuar con los ejercicios escritos.';render();}
}
function remaining(){return Math.max(0,Math.ceil((Date.parse(state.session?.deadlineAt)-Date.now()-state.offset)/1000));}
function updateTimer(){const el=document.querySelector('#timer');if(el){const n=remaining();el.textContent=Math.floor(n/60)+':'+String(n%60).padStart(2,'0');el.parentElement.classList.toggle('urgent',n<60);}}
root.addEventListener('click',async event=>{
 const b=event.target.closest('[data-action]');if(!b||b.disabled||state.busy)return;
 const action=b.dataset.action;
 if(action==='dismiss'){state.error='';render();}
 else if(action==='home'||action==='nav'){cleanupAudio();state.error='';state.view=action==='home'?'home':b.dataset.view;if(state.view==='guide'&&state.active){await openSession(state.active.id,true);return;}render();window.scrollTo({top:0});}
 else if(action==='domain'){const preferred=state.preferredMode;state.preferredMode=null;begin(b.dataset.domain,preferred);}
 else if(action==='quick-mode'){state.preferredMode=b.dataset.mode;state.view='home';render();document.querySelector('#areas-title')?.scrollIntoView({behavior:'smooth'});}
 else if(action==='choose')choose(b.dataset.value,b.dataset.label);
 else if(action==='reset-config')begin(state.config.domain);
 else if(action==='start')await start();
 else if(action==='answer'){state.selected=Number(b.dataset.index);state.submitKey=null;render();}
 else if(action==='submit'||action==='skip')await submit(action==='skip');
 else if(action==='next'){cleanupAudio();state.feedback=null;state.tutor=[];state.tutorError='';state.selected=null;state.input='';if(state.session.completedAt)state.view='result';else state.index=state.session.answers.length;render();window.scrollTo({top:0,behavior:'smooth'});}
 else if(action==='ask-finish'){state.modal=true;render();}
 else if(action==='cancel-finish'){state.modal=false;render();}
 else if(action==='finish')await finish();
 else if(action==='resume')await openSession(state.active.id,true);
 else if(action==='open-session')await openSession(b.dataset.id);
 else if(action==='repeat'){const config={...state.session.config,mode:'diagnostico'};begin(config.domain,'diagnostico');if(state.view==='guide'){state.config=config;state.step='review';render();window.scrollTo({top:0});}}
 else if(action==='practice-item')practiceFrom(state.session.summary.outcomes[Number(b.dataset.index)].question);
 else if(action==='practice-weak'){const r=state.session.summary;practiceFrom(r.outcomes.find(o=>o.question.skill===r.weak[0])?.question||r.outcomes[0].question);}
 else if(action==='tutor-shortcut')await askTutor(b.dataset.message);
 else if(action==='record')await record();
});
root.addEventListener('change',event=>{if(event.target.dataset.config){const key=event.target.dataset.config;state.config[key]=['count','threshold','minutes'].includes(key)?Number(event.target.value):event.target.value;state.createKey=uid();render();}});
root.addEventListener('input',event=>{if(event.target.id==='numeric-answer'){state.input=event.target.value;state.submitKey=null;const b=root.querySelector('[data-action="submit"]');if(b)b.disabled=!state.input.trim();}});
root.addEventListener('submit',async event=>{
 event.preventDefault();if(state.busy)return;
 if(event.target.id==='tutor-form'){await askTutor(event.target.querySelector('input').value);return;}
 if(event.target.id==='guide-form'){
   const text=event.target.querySelector('input').value.trim();if(!text)return;
   const option=choices().find(([value,label])=>norm(value)===norm(text)||norm(label)===norm(text));
   if(option){choose(option[0],option[1]);return;}
   if(state.ai.ready&&['subject','topic'].includes(state.step)&&!(state.step==='subject'&&state.config.domain==='idiomas')){choose(text,text);return;}
   state.error='Elige una de las opciones disponibles. La conversación libre sobre otros temas requiere activar la IA.';render();
 }
});
document.addEventListener('keydown',event=>{
 if(!state.modal)return;
 if(event.key==='Escape'&&!state.busy){state.modal=false;render();}
 if(event.key==='Tab'){const buttons=[...root.querySelectorAll('.modal button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
setInterval(()=>{updateTimer();if(state.session?.deadlineAt&&!state.session.completedAt&&!state.busy&&remaining()<=0)finish();},1000);
window.addEventListener('beforeunload',()=>{state.media?.getTracks().forEach(t=>t.stop());});
render();
refresh().then(render).catch(err=>{state.ready=true;state.error=err.message;render();});
