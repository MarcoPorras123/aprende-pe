import { questions, routes } from './questions.js';
import { MODES, selectQuestions, evaluate, shouldShowImmediateFeedback, summarize } from './engine.js';

const STORAGE_KEY = 'aprende-pe-sessions-v1';
const app = document.querySelector('#app');
const state = {
  view: 'home', route: 'frances', mode: 'practica', skill: 'Todas',
  session: null, selected: null, feedback: false, summary: null,
  history: loadHistory(), secondsLeft: 0, timer: null, audioMessage: '',
};

function loadHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item) => item && routes[item.route] && MODES[item.mode]).slice(-30) : [];
  } catch { return []; }
}

function saveHistory() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history)); }
  catch { /* El prototipo sigue funcionando si el navegador bloquea almacenamiento. */ }
}

function formatDate(iso) {
  try { return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' }).format(new Date(iso)); }
  catch { return 'Sesión'; }
}

function header(title, eyebrow, subtitle = '') {
  return `<div class="page-head"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>`;
}

function card(title, body, extra = '') {
  return `<div class="card ${extra}">${title ? `<h2>${title}</h2>` : ''}${body}</div>`;
}

function routeCard(route, action = 'route') {
  const item = routes[route];
  return `<button class="route-card" data-action="${action}" data-value="${route}">
    <span class="route-icon">${item.icon}</span><span class="route-copy"><strong>${item.label}</strong><small>${item.subtitle}</small></span><span class="chevron">↗</span>
  </button>`;
}

function shell(content) {
  const active = state.view === 'progress' ? 'progress' : state.view === 'home' ? 'home' : 'practice';
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">P<span>•</span></span><span>Aprende Pe!<small>Aprende con un plan</small></span></div>
      <nav aria-label="Navegación principal">
        <button class="nav-link ${active === 'home' ? 'active' : ''}" data-action="nav-home"><span>⌂</span> Inicio</button>
        <button class="nav-link ${active === 'practice' ? 'active' : ''}" data-action="nav-practice"><span>◇</span> Practicar</button>
        <button class="nav-link ${active === 'progress' ? 'active' : ''}" data-action="nav-progress"><span>▤</span> Progreso</button>
      </nav>
      <div class="sidebar-note"><span class="status-dot"></span> Versión de prueba<br><small>Contenido de demostración</small></div>
    </aside>
    <div class="main-column"><header class="topbar"><span class="topbar-brand">Aprende Pe!</span><span class="prototype-badge">PROTOTIPO FUNCIONAL · v0.1</span></header>
      <main id="main-content">${content}</main>
      <nav class="bottom-nav" aria-label="Navegación principal">
        <button class="${active === 'home' ? 'active' : ''}" data-action="nav-home"><span>⌂</span>Inicio</button>
        <button class="${active === 'practice' ? 'active' : ''}" data-action="nav-practice"><span>◇</span>Practicar</button>
        <button class="${active === 'progress' ? 'active' : ''}" data-action="nav-progress"><span>▤</span>Progreso</button>
      </nav>
    </div>
  </div>`;
}

function homeView() {
  const last = state.history.at(-1);
  return `<div class="content-wrap home-view">
    <div class="hero"><div><span class="eyebrow">UN PASO A LA VEZ</span><h1>Aprende con un plan<br>hecho para ti<span class="accent">.</span></h1>
      <p>Elige tu objetivo, responde una práctica breve y entiende cada error. Después podrás comprobar cuánto avanzaste.</p>
      <button class="primary-button" data-action="nav-practice">Empezar a practicar <span>→</span></button></div>
      <div class="hero-art" aria-hidden="true"><div class="art-orbit"><div class="art-check">✓</div><span>Tu siguiente<br><b>gran paso</b></span></div><div class="art-spark one">✦</div><div class="art-spark two">✳</div></div>
    </div>
    <div class="section-title"><div><span class="eyebrow">TUS CAMINOS</span><h2>¿Qué quieres estudiar?</h2></div><span class="section-hint">Puedes cambiar de ruta cuando quieras</span></div>
    <div class="route-grid">${routeCard('frances')}${routeCard('preuni')}</div>
    <div class="home-lower">${card('Cómo funciona', '<div class="steps"><div><b>01</b><span>Elige una ruta y un modo</span></div><div><b>02</b><span>Resuelve preguntas breves</span></div><div><b>03</b><span>Revisa lo que observamos</span></div></div>', 'steps-card')}
      ${card(last ? 'Tu última práctica' : 'Tu punto de partida', last ? `<p>${routes[last.route].label} · ${MODES[last.mode].label}</p><strong class="large-score">${last.correct} de ${last.total}</strong><p class="muted">${formatDate(last.date)} · aciertos observados, no nivel certificado</p><button class="text-button" data-action="nav-progress">Ver progreso →</button>` : '<p>Empieza con unos pocos ejercicios. Tu progreso se guardará solo en este dispositivo.</p><button class="text-button" data-action="nav-practice">Elegir objetivo →</button>', 'last-card')}
    </div>
  </div>`;
}

function chooseView() {
  return `<div class="content-wrap narrow">
    ${header('¿Qué quieres estudiar?', 'PASO 01 · OBJETIVO', 'Elige una ruta. Estamos comparando ambas para decidir el primer producto completo.')}
    <div class="stack">${routeCard('frances')}${routeCard('preuni')}</div>
    ${card('¿No sabes tu nivel?', '<p>En la siguiente pantalla elige <strong>«Quiero probarme»</strong>. Esta prueba breve solo orienta la práctica; no certifica un nivel.</p>', 'soft-card')}
  </div>`;
}

function setupView() {
  const route = routes[state.route];
  const startLabel = state.mode === 'diagnostico' ? 'Empezar diagnóstico' : state.mode === 'simulacro' ? 'Empezar mini simulacro' : 'Comenzar práctica';
  const skills = ['Todas', ...new Set(questions.filter((item) => item.route === state.route).map((item) => item.skill))];
  const context = state.route === 'frances'
    ? '<strong>Francés · tareas de muestra</strong><span>Las preguntas no asignan un nivel MCER.</span>'
    : '<strong>Biología · contenido de muestra</strong><span>Sin reglas ni preguntas oficiales de una universidad.</span>';
  return `<div class="content-wrap narrow">
    <button class="back-link" data-action="nav-practice">← Cambiar de ruta</button>
    ${header(route.label === 'Francés' ? 'Francés a tu ritmo' : 'Prepara tu objetivo', route.eyebrow, 'Escoge cómo practicar hoy. Puedes cambiarlo en cualquier momento.')}
    <div class="context-banner">${context}</div>
    <div class="form-section"><div class="section-title compact"><div><span class="eyebrow">01</span><h2>¿Qué quieres practicar?</h2></div></div>
      <div class="chip-row">${skills.map((skill) => `<button class="chip ${state.skill === skill ? 'selected' : ''}" data-action="skill" data-value="${skill}" aria-pressed="${state.skill === skill}">${skill}</button>`).join('')}</div>
      <p class="field-help">En diagnóstico y mini simulacro se mezclan las habilidades disponibles.</p>
    </div>
    <div class="form-section"><div class="section-title compact"><div><span class="eyebrow">02</span><h2>Elige el tipo de sesión</h2></div></div>
      <div class="mode-list">${Object.entries(MODES).map(([key, mode]) => `<button class="mode-card ${state.mode === key ? 'selected' : ''}" data-action="mode" data-value="${key}" aria-pressed="${state.mode === key}"><span class="radio-dot"></span><span><strong>${mode.label}</strong><small>${mode.description}</small></span></button>`).join('')}</div>
    </div>
    <button class="primary-button full" data-action="start">${startLabel} <span>→</span></button>
    <p class="disclaimer">Preguntas originales de demostración. Aún no hay corrección por IA ni evaluación docente.</p>
  </div>`;
}

function feedbackPanel(question, result) {
  return `<div class="feedback ${result.correct ? 'correct' : 'incorrect'}" role="status">
    <span class="feedback-symbol">${result.correct ? '✓' : '↗'}</span>
    <div><strong>${result.correct ? '¡Bien resuelto!' : 'Revisemos esta respuesta'}</strong>
      <p>${result.correct ? 'Elegiste la respuesta esperada.' : `La opción esperada es «${question.options[question.correctIndex]}».`}</p>
      <p>${question.explanation}</p><div class="next-step"><b>Para practicar después</b><span>${question.nextStep}</span></div>
    </div>
  </div>`;
}

function questionView() {
  const { items, currentIndex, answers, mode } = state.session;
  const question = items[currentIndex];
  const result = state.feedback ? evaluate(question, state.selected) : null;
  const progress = ((currentIndex + (state.feedback ? 1 : 0)) / items.length) * 100;
  return `<div class="content-wrap narrow question-view">
    <div class="question-top"><button class="back-link" data-action="exit-session">← Salir</button><span class="session-label">${routes[state.route].label} · ${MODES[mode].label}</span>${mode === 'simulacro' ? `<span class="timer" id="timer" aria-live="off">${formatTime(state.secondsLeft)}</span>` : ''}</div>
    <div class="progress-label"><span>Pregunta ${currentIndex + 1} de ${items.length}</span><span>${answers.length} respondidas</span></div><div class="progress-track"><span style="width:${progress}%"></span></div>
    <div class="question-card"><span class="eyebrow">${question.skill.toUpperCase()}</span><h1>${question.prompt}</h1>
      ${question.context ? `<div class="reading-context"><span>LEE EL MENSAJE</span><p>${question.context}</p></div>` : ''}
      ${question.audioText ? `<div class="audio-box"><div class="audio-icon">♪</div><div><strong>Mensaje de voz</strong><span>Escucha y luego responde.</span></div><button class="audio-button" data-action="audio" aria-label="Reproducir mensaje en francés">▶ Escuchar</button></div>${state.audioMessage ? `<p class="audio-note" role="status">${state.audioMessage}</p>` : ''}` : ''}
      <div class="options" role="group" aria-label="Opciones de respuesta">${question.options.map((option, index) => `<button class="option ${state.selected === index ? 'selected' : ''}" data-action="select" data-value="${index}" aria-pressed="${state.selected === index}" ${state.feedback ? 'disabled' : ''}><span class="option-letter">${String.fromCharCode(65 + index)}</span><span>${option}</span></button>`).join('')}</div>
      ${state.feedback ? feedbackPanel(question, result) : ''}
      ${state.feedback ? `<button class="primary-button full" data-action="next">${currentIndex === items.length - 1 ? 'Ver resumen' : 'Siguiente pregunta'} <span>→</span></button>` : `<button class="primary-button full" data-action="submit" ${state.selected === null ? 'disabled' : ''}>${mode === 'practica' ? 'Comprobar respuesta' : currentIndex === items.length - 1 ? 'Terminar sesión' : 'Guardar y continuar'} <span>→</span></button>`}
      <p class="disclaimer">${mode === 'practica' ? 'Recibirás la explicación después de cada respuesta.' : 'Verás las explicaciones al terminar la sesión.'}</p>
    </div>
  </div>`;
}

function resultView() {
  const summary = state.summary;
  if (!summary) return homeView();
  const outcomeCards = summary.outcomes.map((outcome, index) => `<details class="review-item"><summary><span class="review-symbol ${outcome.correct ? 'ok' : 'no'}">${outcome.correct ? '✓' : '↗'}</span><span>${index + 1}. ${outcome.question.prompt}</span><span class="chevron">⌄</span></summary><div class="review-detail"><p>Tu respuesta: <strong>${outcome.question.options[outcome.selectedIndex]}</strong></p><p>Respuesta esperada: <strong>${outcome.question.options[outcome.correctIndex]}</strong></p><p>${outcome.question.explanation}</p></div></details>`).join('');
  return `<div class="content-wrap narrow result-view"><span class="eyebrow">SESIÓN COMPLETADA</span><div class="result-hero"><div class="result-ring"><strong>${summary.correct}</strong><span>de ${summary.total}</span></div><div><h1>Así te fue hoy</h1><p>Respondiste ${summary.answered} de ${summary.total} preguntas de muestra. Revisa las explicaciones y decide qué volver a practicar.</p></div></div>
    <div class="soft-note">${state.route === 'frances' ? 'Este resultado no asigna ni certifica un nivel de francés.' : 'Este resultado no predice un puntaje ni representa un examen oficial.'} Una sesión breve no identifica por sí sola una falencia estable.</div>
    ${summary.unanswered ? `<p class="unanswered-note">${summary.unanswered} ${summary.unanswered === 1 ? 'pregunta quedó' : 'preguntas quedaron'} sin responder al terminar el tiempo.</p>` : ''}
    <div class="section-title compact"><div><span class="eyebrow">EVIDENCIA OBSERVADA</span><h2>Por habilidad</h2></div></div>
    <div class="skill-list">${Object.entries(summary.skills).map(([skill, data]) => `<div class="skill-row"><span>${skill}</span><strong>${data.correct} / ${data.total}</strong></div>`).join('')}</div>
    <div class="section-title compact"><div><span class="eyebrow">APRENDE DEL INTENTO</span><h2>Revisar respuestas</h2></div></div><div class="review-list">${outcomeCards}</div>
    <div class="result-actions"><button class="primary-button full" data-action="repeat">Practicar otra vez <span>→</span></button><button class="secondary-button full" data-action="nav-progress">Ver mi progreso</button></div>
  </div>`;
}

function progressView() {
  const sessions = [...state.history].reverse();
  const total = sessions.length;
  const byRoute = Object.keys(routes).map((route) => {
    const routeSessions = sessions.filter((session) => session.route === route);
    const stats = {};
    for (const session of routeSessions) for (const [skill, value] of Object.entries(session.skills || {})) {
      const row = stats[skill] ?? { correct: 0, total: 0 };
      row.correct += value.correct; row.total += value.total; stats[skill] = row;
    }
    return { route, routeSessions, stats };
  });
  return `<div class="content-wrap progress-view">${header('Tu progreso, paso a paso', 'LO QUE HAS PRACTICADO', 'Aquí verás tus intentos observados en este dispositivo. No es una medición certificada de dominio.')}
    <div class="progress-summary"><div class="summary-number"><strong>${total}</strong><span>${total === 1 ? 'sesión completada' : 'sesiones completadas'}</span></div><div class="summary-number"><strong>${sessions.reduce((sum, item) => sum + (item.answered ?? item.total), 0)}</strong><span>respuestas enviadas</span></div></div>
    <div class="progress-columns">${byRoute.map(({ route, routeSessions, stats }) => card(routes[route].label, routeSessions.length ? `<p class="muted">${routeSessions.length} ${routeSessions.length === 1 ? 'sesión realizada' : 'sesiones realizadas'}</p><div class="skill-list">${Object.entries(stats).map(([skill, item]) => `<div class="skill-row"><span>${skill}</span><strong>${item.correct} / ${item.total}</strong></div>`).join('')}</div>` : '<p class="muted">Todavía sin evaluar en esta ruta.</p>', 'progress-card')).join('')}</div>
    ${card('Aún sin evaluar', '<p>La expresión oral y otros temas requieren actividades y criterios adicionales. Seguiremos agregándolos después de validarlos.</p>', 'soft-card')}
    <div class="section-title compact"><div><span class="eyebrow">HISTORIAL</span><h2>Sesiones recientes</h2></div></div>
    ${sessions.length ? `<div class="history-list">${sessions.slice(0, 8).map((session) => `<div class="history-row"><div><strong>${routes[session.route].label}</strong><span>${MODES[session.mode].label} · ${formatDate(session.date)}</span></div><b>${session.correct} de ${session.total}</b></div>`).join('')}</div>` : `<div class="empty-state">Aún no hay sesiones. <button class="text-button" data-action="nav-practice">Empieza una práctica →</button></div>`}
  </div>`;
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function render() {
  const views = { home: homeView, choose: chooseView, setup: setupView, question: questionView, result: resultView, progress: progressView };
  app.innerHTML = shell((views[state.view] || homeView)());
}

function stopTimer() {
  if (state.timer) clearInterval(state.timer);
  state.timer = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function startSession() {
  const items = selectQuestions(questions, state.route, state.mode, state.skill);
  if (!items.length) return;
  stopTimer();
  state.session = { items, currentIndex: 0, answers: [], mode: state.mode };
  state.selected = null; state.feedback = false; state.audioMessage = '';
  state.secondsLeft = state.mode === 'simulacro' ? 5 * 60 : 0;
  state.view = 'question'; render();
  if (state.mode === 'simulacro') state.timer = setInterval(() => {
    state.secondsLeft -= 1;
    const clock = document.querySelector('#timer');
    if (clock) clock.textContent = formatTime(Math.max(state.secondsLeft, 0));
    if (state.secondsLeft <= 0) finishSession();
  }, 1000);
}

function finishSession() {
  if (!state.session || state.view !== 'question') return;
  stopTimer();
  const { items, answers, mode } = state.session;
  const scored = summarize(items, answers);
  state.summary = { ...scored, total: items.length, answered: answers.length, unanswered: items.length - answers.length };
  state.history.push({ date: new Date().toISOString(), route: state.route, mode, correct: state.summary.correct, total: state.summary.total, answered: state.summary.answered, skills: state.summary.skills });
  state.history = state.history.slice(-30);
  saveHistory();
  state.view = 'result'; render();
}

function submitAnswer() {
  if (!state.session || state.selected === null || state.feedback) return;
  const question = state.session.items[state.session.currentIndex];
  state.session.answers.push({ questionId: question.id, selectedIndex: state.selected });
  if (shouldShowImmediateFeedback(state.session.mode)) {
    state.feedback = true; render();
  } else { nextQuestion(); }
}

function nextQuestion() {
  if (!state.session) return;
  if (state.session.currentIndex >= state.session.items.length - 1) { finishSession(); return; }
  state.session.currentIndex += 1;
  state.selected = null; state.feedback = false; state.audioMessage = '';
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  render();
}

function playAudio() {
  const question = state.session?.items[state.session.currentIndex];
  if (!question?.audioText) return;
  if (!('speechSynthesis' in window)) {
    state.audioMessage = 'Este navegador no ofrece reproducción por voz. Cambia de navegador para probar listening.';
    render(); return;
  }
  window.speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(question.audioText);
  speech.lang = 'fr-FR'; speech.rate = 0.88;
  const voice = window.speechSynthesis.getVoices().find((item) => item.lang.toLowerCase().startsWith('fr'));
  if (voice) speech.voice = voice;
  speech.onerror = () => { state.audioMessage = 'No se pudo reproducir el audio en este dispositivo.'; render(); };
  window.speechSynthesis.speak(speech);
  state.audioMessage = 'Audio sintético de demostración; la voz depende de tu dispositivo.';
  render();
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const { action, value } = button.dataset;
  if (action.startsWith('nav-') || action === 'exit-session') {
    if (state.session && state.view === 'question') stopTimer();
    state.session = null;
    state.view = action === 'nav-progress' ? 'progress' : action === 'nav-home' ? 'home' : 'choose';
    render(); return;
  }
  if (action === 'route') { state.route = value; state.skill = 'Todas'; state.mode = 'practica'; state.view = 'setup'; render(); }
  if (action === 'skill') { state.skill = value; render(); }
  if (action === 'mode') { state.mode = value; render(); }
  if (action === 'start' || action === 'repeat') startSession();
  if (action === 'select' && !state.feedback) { state.selected = Number(value); render(); }
  if (action === 'submit') submitAnswer();
  if (action === 'next') nextQuestion();
  if (action === 'audio') playAudio();
});

render();
