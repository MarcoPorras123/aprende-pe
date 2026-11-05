import { createHash, randomInt } from 'node:crypto';

export const catalog = {
  idiomas: { label: 'Idiomas', subjects: ['Francés', 'Inglés'], topics: {
    'Francés': ['General', 'Gramática', 'Lectura', 'Vocabulario'],
    'Inglés': ['General', 'Gramática', 'Lectura', 'Vocabulario'],
  }},
  preuni: { label: 'Preuniversitario', subjects: ['General', 'Matemática', 'Biología', 'Historia'], topics: {
    General: ['General'], 'Matemática': ['General', 'Ecuaciones', 'Porcentajes', 'Proporciones'],
    'Biología': ['General', 'Célula', 'Genética', 'Ecología'],
    Historia: ['General', 'Historia del Perú'],
  }},
  universitario: { label: 'Universitario', subjects: ['Cálculo', 'Estadística', 'Programación'], topics: {
    'Cálculo': ['General', 'Derivadas', 'Integrales', 'Límites'],
    'Estadística': ['General', 'Media y mediana', 'Probabilidad'],
    'Programación': ['General', 'JavaScript', 'Lógica'],
  }},
};
export const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
export const fingerprint = q => createHash('sha256').update(normalize(q.prompt + '|' + (q.context || ''))).digest('hex');
export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = randomInt(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}
function item(domain, subject, topic, prompt, options, explanation, extra = {}) {
  return { domain, subject, topic, skill: topic, prompt, options: options.map(String), correctIndex: 0,
    explanation, concept: topic, nextStep: 'Resuelve otra actividad de ' + topic.toLowerCase() + ' sin consultar la explicación.',
    type: 'choice', level: '', context: '', answer: '', ...extra };
}
const pool = [];
function add(...args) { pool.push(item(...args)); }
const fr = [
  ['A1','Je ___ étudiante.',['suis','es','sommes','êtes'],'Con je, être se conjuga suis. La frase significa «Soy estudiante».'],
  ['A1','Tu ___ un frère ?',['as','ai','a','avons'],'Con tu se usa as, del verbo avoir: «¿Tienes un hermano?».'],
  ['A1','Nous ___ à Lima.',['habitons','habitez','habitent','habite'],'La terminación de los verbos regulares en -er con nous es -ons.'],
  ['A1','Elle ___ française.',['est','sont','es','sommes'],'Con elle se usa est. El adjetivo francesa es française.'],
  ['A1','Vous ___ un café ?',['voulez','voulons','veux','veulent'],'La forma de vouloir con vous es voulez.'],
  ['A1','Ils ___ au football.',['jouent','jouons','jouez','joue'],'Con ils, los verbos regulares en -er terminan en -ent.'],
  ['A1','C’est ___ livre de Marie.',['le','la','les','une'],'Livre es masculino singular: le livre.'],
  ['A1','Je n’aime ___ le café.',['pas','plus de','jamais de','rien de'],'La negación habitual rodea el verbo: ne… pas.'],
  ['A2','Hier, nous ___ un film.',['avons regardé','regardons','allons regarder','regardions demain'],'Hier sitúa la acción terminada en el pasado. Se usa avoir y el participio regardé.'],
  ['A2','Demain, je ___ partir tôt.',['vais','suis','ai','fais'],'Aller en presente seguido de infinitivo expresa un futuro próximo.'],
  ['A2','Elle est plus grande ___ son frère.',['que','de','à','pour'],'La comparación de superioridad utiliza plus… que.'],
  ['A2','Nous avons acheté ___ pommes.',['des','du','de la','un'],'Pommes es plural. En una afirmación se emplea des para una cantidad no especificada.'],
  ['A2','Quand j’étais petit, je ___ souvent ici.',['venais','viendrai','viens','venir'],'Una costumbre pasada se expresa con el imparfait: je venais.'],
  ['B1','Si j’avais le temps, je ___ davantage.',['lirais','lirai','lis','lire'],'Si + imparfait se combina aquí con conditionnel présent: je lirais.'],
  ['B1','C’est le livre ___ je t’ai parlé.',['dont','que','où','qui'],'Parler de quelque chose: dont sustituye el complemento introducido por de.'],
  ['B1','Il faut que tu ___ à l’heure.',['sois','es','seras','étais'],'Il faut que requiere el subjonctif; con tu, être toma la forma sois.'],
  ['B1','Bien qu’il ___ fatigué, il continue.',['soit','est','sera','était'],'Bien que introduce aquí el subjonctif. La forma de être con il es soit.'],
];
const en = [
  ['A1','She ___ a teacher.',['is','are','am','be'],'Con she, el presente de be es is.'],
  ['A1','They ___ in a small house.',['live','lives','living','is live'],'Con they se usa la forma base del verbo en presente simple.'],
  ['A1','I have ___ apple.',['an','a','some','any'],'Se usa an antes de un sonido vocálico, como el de apple.'],
  ['A1','___ you like music?',['Do','Does','Are','Is'],'Las preguntas en presente simple con you usan el auxiliar do.'],
  ['A1','There ___ two chairs in the room.',['are','is','am','be'],'Two chairs es plural; se utiliza there are.'],
  ['A1','He ___ coffee every morning.',['drinks','drink','drinking','is drink'],'En presente simple, la tercera persona singular añade -s.'],
  ['A1','The book is ___ the table.',['on','at to','between of','from in'],'On expresa que el libro está sobre la superficie de la mesa.'],
  ['A1','We ___ hungry.',['are','is','am','has'],'Con we se usa are. Hungry describe hambre.'],
  ['A2','Yesterday, she ___ to the park.',['went','goes','go','going'],'Yesterday indica pasado. El pasado irregular de go es went.'],
  ['A2','This exercise is ___ than the last one.',['easier','easy','easiest','more easy than'],'El comparativo de easy es easier; se usa con than.'],
  ['A2','I ___ my homework yet.',['haven’t finished','didn’t finished','don’t finished','am not finish'],'Yet en este contexto combina con present perfect negativo: have not + participio.'],
  ['A2','We ___ dinner when the phone rang.',['were having','have','are having','will have'],'Una acción en desarrollo en el pasado usa past continuous: were having.'],
  ['A2','There isn’t ___ milk left.',['any','many','a','a few'],'Milk es incontable y, en esta negación, se usa any.'],
  ['B1','If I had more time, I ___ another language.',['would learn','will learn','learn','am learning'],'La situación hipotética usa if + pasado y would + verbo base.'],
  ['B1','The report ___ yesterday.',['was written','wrote','is writing','has wrote'],'La voz pasiva en pasado es was + participio: was written.'],
  ['B1','She has lived here ___ 2020.',['since','for','during of','from since'],'Since introduce el punto de inicio; for introduciría una duración.'],
  ['B1','He suggested ___ a short break.',['taking','to take','take','taken'],'Suggest puede ir seguido de un gerundio: suggested taking.'],
];
for (const [subject, rows] of [['Francés', fr], ['Inglés', en]]) {
  for (const [level, prompt, options, explanation] of rows)
    add('idiomas', subject, 'Gramática', 'Completa: «' + prompt + '»', options, explanation, { level });
}
const wordsFr = [['la gare','la estación'],['le cahier','el cuaderno'],['demain','mañana'],['la fenêtre','la ventana'],['le billet','el billete'],['la bibliothèque','la biblioteca'],['le rendez-vous','la cita'],['le médecin','el médico']];
const wordsEn = [['appointment','cita'],['borrow','pedir prestado'],['receipt','recibo'],['neighbour','vecino'],['journey','viaje'],['although','aunque'],['usually','habitualmente'],['improve','mejorar']];
for (const [subject, words] of [['Francés', wordsFr], ['Inglés', wordsEn]]) for (let i = 0; i < words.length; i++) {
  const [word, answer] = words[i];
  add('idiomas', subject, 'Vocabulario', '¿Qué significa «' + word + '» en español?',
    [answer, words[(i+1)%words.length][1], words[(i+3)%words.length][1], words[(i+5)%words.length][1]],
    '«' + word + '» significa «' + answer + '». Relaciona la palabra con una situación cotidiana para recordarla.', { level: i < 4 ? 'A1' : 'A2' });
}
const names = ['Emma', 'Lucas', 'Sofia', 'Alex', 'Nora', 'Hugo', 'Clara', 'Leo'];
for (const [subject, code] of [['Francés','fr'], ['Inglés','en']]) for (let i=0; i<8; i++) {
  const hour = i+8;
  const context = code === 'fr' ? 'Bonjour ' + names[i] + ', notre cours commence à ' + hour + ' heures. Apporte ton cahier. La salle est au deuxième étage.'
    : 'Hi ' + names[i] + ', our class starts at ' + hour + ':00. Please bring your notebook. The room is on the second floor.';
  add('idiomas',subject,'Lectura','Según el mensaje dirigido a ' + names[i] + ', ¿a qué hora empieza la clase?',
    [hour+':00',(hour+1)+':00',(hour-1)+':00',(hour+2)+':00'],'El mensaje indica explícitamente la hora de inicio: ' + hour + ':00.',{ context,level:'A1' });
}
for (const [subject, code] of [['Francés','fr'], ['Inglés','en']]) for (let i=0; i<6; i++) {
  const context = code === 'fr' ? names[i] + ' allait habituellement au travail en bus. Cette semaine, le service est interrompu. Elle a donc décidé de prendre le vélo, même si le trajet est plus long.'
    : names[i] + ' usually travelled to work by bus. This week, the service has been suspended. She has therefore decided to cycle, even though the journey takes longer.';
  add('idiomas',subject,'Lectura','¿Por qué ' + names[i] + ' cambia su medio de transporte?',
    ['El servicio de autobús está suspendido','Quiere llegar más rápido','Ha cambiado de trabajo','No sabe usar el autobús'],
    'El texto presenta la suspensión del autobús como causa del cambio. El trayecto en bicicleta tarda más, no menos.', {context,level:'B1'});
}
const bio = [
  ['Célula','¿Qué estructura controla el intercambio selectivo entre la célula y su entorno?',['Membrana plasmática','Ribosoma','Pared celular','Nucléolo'],'La membrana regula el paso de sustancias mediante su composición y proteínas de transporte.'],
  ['Célula','¿Qué estructura participa directamente en la síntesis de proteínas?',['Ribosoma','Lisosoma','Centriolo','Vacuola'],'El ribosoma traduce la información del ARN mensajero para construir una cadena de aminoácidos.'],
  ['Célula','¿Qué orgánulo realiza la fotosíntesis en las células vegetales?',['Cloroplasto','Mitocondria','Lisosoma','Aparato de Golgi'],'Los cloroplastos contienen los componentes que captan energía luminosa y permiten sintetizar compuestos orgánicos.'],
  ['Célula','¿Cómo se llama el movimiento neto de agua a través de una membrana selectivamente permeable?',['Ósmosis','Endocitosis','Traducción','Exocitosis'],'La ósmosis es el movimiento del agua asociado a diferencias en la concentración de solutos a ambos lados de la membrana.'],
  ['Célula','¿Qué distingue a una célula eucariota de una procariota?',['Un núcleo delimitado por membrana','La presencia de ADN','La presencia de ribosomas','La presencia de membrana plasmática'],'Ambos tipos poseen ADN, ribosomas y membrana. La eucariota presenta un núcleo rodeado por una envoltura.'],
  ['Célula','¿Qué transporte desplaza solutos contra su gradiente y requiere energía?',['Transporte activo','Difusión simple','Ósmosis','Difusión facilitada pasiva'],'El transporte activo utiliza energía para mover sustancias contra su gradiente electroquímico.'],
  ['Genética','¿Qué base nitrogenada usa el ARN en lugar de timina?',['Uracilo','Adenina','Citosina','Guanina'],'El ARN utiliza uracilo; el ADN utiliza timina.'],
  ['Genética','¿Cómo se llama la síntesis de ARN a partir de una plantilla de ADN?',['Transcripción','Traducción','Replicación','Fecundación'],'La transcripción produce ARN a partir de ADN. La traducción utiliza ARN para sintetizar proteínas.'],
  ['Genética','¿Qué describe el genotipo?',['La constitución genética de un organismo','Solo su aspecto visible','Su alimentación diaria','Su hábitat'],'El genotipo se refiere a la constitución genética; el fenotipo incluye características observables influidas también por el ambiente.'],
  ['Genética','En un modelo mendeliano simple, ¿qué proporción de aa se espera del cruce Aa × Aa?',['25 %','50 %','75 %','100 %'],'Las cuatro combinaciones equiprobables son AA, Aa, aA y aa. Una de cuatro corresponde a aa.'],
  ['Ecología','¿Qué organismo es productor en una cadena alimentaria terrestre?',['Una planta que realiza fotosíntesis','Un zorro','Un hongo descomponedor','Un saltamontes'],'Los productores sintetizan materia orgánica a partir de fuentes inorgánicas; las plantas usan energía luminosa.'],
  ['Ecología','¿Qué relación beneficia a ambos organismos participantes?',['Mutualismo','Parasitismo','Depredación','Amensalismo'],'En el mutualismo ambos participantes obtienen un beneficio.'],
  ['Ecología','¿Qué representa una población en ecología?',['Individuos de una misma especie en un área y tiempo determinados','Todas las especies del planeta','Solo los factores físicos de un lugar','Una única célula'],'La población delimita individuos de una misma especie en un contexto espacial y temporal.'],
  ['Ecología','¿Qué proceso devuelve carbono a la atmósfera como CO₂?',['Respiración celular','Fijación fotosintética de carbono','Formación de glucosa por fotosíntesis','Absorción de CO₂ por hojas'],'La respiración celular libera CO₂ durante la oxidación de compuestos orgánicos.'],
];
for (const row of bio) add('preuni','Biología',...row);
const history = [
  ['¿En qué año se proclamó la independencia del Perú en Lima?',['1821','1824','1810','1836'],'José de San Martín proclamó la independencia en Lima el 28 de julio de 1821.'],
  ['¿Qué batalla de 1824 fue decisiva para la independencia sudamericana?',['Ayacucho','Angamos','Arica','Tarapacá'],'La batalla de Ayacucho se libró el 9 de diciembre de 1824 y fue decisiva en las guerras de independencia.'],
  ['¿Cuál fue la capital del Tahuantinsuyo?',['Cusco','Lima','Cajamarca','Trujillo'],'Cusco fue el principal centro político del Estado inca.'],
  ['¿Qué sistema de registro mediante cuerdas y nudos utilizaron los incas?',['Quipu','Alfabeto latino','Papiro','Imprenta'],'Los quipus utilizaron cuerdas y nudos para registrar información, incluida información numérica.'],
  ['¿Qué ciudad fue fundada por los españoles como Ciudad de los Reyes en 1535?',['Lima','Cusco','Arequipa','Puno'],'Francisco Pizarro fundó la Ciudad de los Reyes, hoy Lima, el 18 de enero de 1535.'],
  ['¿En qué año comenzó la Guerra del Pacífico?',['1879','1821','1883','1900'],'La Guerra del Pacífico comenzó en 1879; conviene distinguir el inicio de las fechas de tratados posteriores.'],
  ['¿Qué líder encabezó la rebelión iniciada en 1780 en el sur andino?',['Túpac Amaru II','José de San Martín','Simón Bolívar','Miguel Grau'],'José Gabriel Condorcanqui, Túpac Amaru II, encabezó la rebelión iniciada en 1780.'],
  ['¿Qué actividad económica destacó en el Perú durante la llamada era del guano?',['Exportación de guano','Industria automotriz','Exportación de petróleo a gran escala','Fabricación de computadoras'],'La exportación de guano fue una fuente importante de ingresos estatales durante parte del siglo XIX.'],
];
for(const row of history) add('preuni','Historia','Historia del Perú',...row);
for(let a=2;a<=14;a++) for(let x=2;x<=11;x++) {
  const b = (a+x)%9+1, total=a*x+b;
  add('preuni','Matemática','Ecuaciones','Resuelve: ' + a + 'x + ' + b + ' = ' + total + '. ¿Cuánto vale x?',
    [x,x+1,x-1,x+3],'Resta ' + b + ' a ambos lados: ' + a + 'x = ' + (total-b) + '. Divide entre ' + a + ': x = ' + x + '.',
    {answer:String(x),concept:'Operaciones equivalentes en una ecuación lineal'});
}
for(let p=5;p<=45;p+=5) for(let price=40;price<=160;price+=20) {
  const answer=price*(100-p)/100;
  add('preuni','Matemática','Porcentajes','Un producto cuesta S/ ' + price + ' y tiene ' + p + ' % de descuento. ¿Cuál es el precio final?',
    [answer,price*(1+p/100),price-p,answer+5].map(n=>String(Number(n.toFixed(2)))),'Precio final = precio × (1 − descuento/100). ' + price + ' × ' + (1-p/100).toFixed(2) + ' = S/ ' + answer + '.',
    {answer:String(answer),concept:'Porcentaje de descuento'});
}
for(let rate=2;rate<=12;rate++) for(let n=3;n<=9;n++) add('preuni','Matemática','Proporciones',
  'Si un cuaderno cuesta S/ ' + rate + ', ¿cuánto cuestan ' + n + ' cuadernos al mismo precio?',
  [rate*n,rate+n,rate*(n+1),rate*(n-1)],'Costo total = precio por unidad × cantidad = ' + rate + ' × ' + n + ' = ' + (rate*n) + '.',
  {answer:String(rate*n),concept:'Proporcionalidad directa'});
for(let n=2;n<=7;n++) for(let x=1;x<=9;x++) {
  const answer=n*x**(n-1);
  add('universitario','Cálculo','Derivadas','Si f(x) = x^' + n + ', ¿cuánto vale f′(' + x + ')?',
    [answer,answer+1,answer+n,x**n+2],'La regla de la potencia es d(x^n)/dx = n·x^(n−1). Entonces f′(' + x + ') = ' + n + '·' + x + '^' + (n-1) + ' = ' + answer + '.',
    {answer:String(answer),concept:'Regla de la potencia'});
}
for(let n=2;n<=12;n++) {
  add('universitario','Cálculo','Integrales','Calcula la integral definida de ' + n + 'x entre 0 y 2.',
    [2*n,n,4*n,3*n],'Una antiderivada es (' + n + '/2)x². Al evaluar entre 0 y 2 se obtiene (' + n + '/2)·4 = ' + (2*n) + '.',
    {answer:String(2*n),concept:'Teorema fundamental del cálculo'});
  add('universitario','Cálculo','Límites','Calcula el límite de (x² − ' + (n*n) + ')/(x − ' + n + ') cuando x tiende a ' + n + '.',
    [2*n,n,0,n*n],'Factoriza x² − ' + (n*n) + ' = (x − ' + n + ')(x + ' + n + '). Para x distinto de ' + n + ', el cociente es x + ' + n + '; su límite es ' + (2*n) + '.',
    {answer:String(2*n),concept:'Factorización y límite'});
}
for(let n=2;n<=30;n++) {
  add('universitario','Estadística','Media y mediana','Calcula la media de ' + [n,n+2,n+4,n+6].join(', ') + '.',
    [n+3,n+2,n+4,4*n+12],'La media es la suma dividida por cuatro: ' + (4*n+12) + '/4 = ' + (n+3) + '.',
    {answer:String(n+3),concept:'Media aritmética'});
  add('universitario','Estadística','Probabilidad','Una bolsa tiene ' + n + ' fichas rojas y ' + n + ' azules. ¿Cuál es la probabilidad de extraer una roja al azar?',
    ['1/2','1/4','1/3','1'],'Hay ' + (2*n) + ' fichas equiprobables y ' + n + ' favorables. P(roja) = ' + n + '/' + (2*n) + ' = 1/2.',
    {concept:'Probabilidad clásica'});
}
for(let n=2;n<=25;n++) {
  add('universitario','Programación','JavaScript','¿Qué devuelve [' + n + ', ' + (n+1) + ', ' + (n+2) + '].map(x => x * 2)?',
    [JSON.stringify([n*2,(n+1)*2,(n+2)*2]),JSON.stringify([n,n+1,n+2]),JSON.stringify([n+2,n+3,n+4]),String(6*n+6)],
    'map aplica la función a cada elemento y construye un arreglo nuevo. Cada número se multiplica por dos.', {concept:'Transformación de arreglos'});
  add('universitario','Programación','Lógica','Un bucle recorre i = 0 mientras i < ' + n + ', aumentando i en 1. ¿Cuántas iteraciones realiza?',
    [n,n+1,n-1,2*n],'Los valores son 0 hasta ' + (n-1) + ', inclusive. Eso representa ' + n + ' iteraciones.',{answer:String(n),concept:'Límite exclusivo de un bucle'});
}
// Reject templates with duplicate alternatives rather than present ambiguous items.
export const demoPool = pool.filter(q=>new Set(q.options.map(normalize)).size===4)
  .map(q=>({...q,id:fingerprint(q),version:1,source:'demo',review:'Contenido de muestra; pendiente de revisión docente'}));

export function selectDemo(config, seen = []) {
  const excluded = new Set(seen);
  let eligible = demoPool.filter(q=>q.domain===config.domain && (config.subject==='General'||q.subject===config.subject)
    && (config.topic==='General'||q.topic===config.topic)
    && (config.domain!=='idiomas'||config.level==='auto'||q.level===config.level)
    && !excluded.has(q.id));
  const groups = new Map();
  for (const q of shuffle(eligible)) {
    const key=config.subject==='General'?q.subject:q.subject+'|'+q.topic;
    if(!groups.has(key)) groups.set(key,[]);
    groups.get(key).push(q);
  }
  const selected=[];
  while(selected.length<config.count && [...groups.values()].some(g=>g.length)) {
    for(const g of groups.values()) if(g.length && selected.length<config.count) selected.push(g.pop());
  }
  if(selected.length<config.count) {
    const error=new Error('Quedan ' + selected.length + ' preguntas nuevas para esta selección. Prueba menos preguntas, otro tema o un alcance general. No repetiremos las que ya viste.');
    error.status=422;throw error;
  }
  return selected.map((q,index)=>{
    const copy=structuredClone(q);
    const correct=copy.options[copy.correctIndex];
    copy.options=shuffle(copy.options);copy.correctIndex=copy.options.indexOf(correct);
    if(config.format==='mixed'&&copy.answer&&index%2===1) copy.type='short';
    return copy;
  });
}
