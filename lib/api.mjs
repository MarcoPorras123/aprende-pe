import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { questions } from '../content/questions.js';
import { routes } from '../web/routes.js';
import { MODES, evaluate, selectQuestions, summarize } from '../web/engine.js';

const questionById = new Map(questions.map((question) => [question.id, question]));
const publicQuestion = ({ id, skill, prompt, options, context, audioText }) =>
  ({ id, skill, prompt, options, ...(context ? { context } : {}), ...(audioText ? { audioText } : {}) });
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
const cookieName = 'aprende_pe_guest';
const sessionSummary = (session) => {
  const items = session.questionIds.map((id) => questionById.get(id));
  const scored = summarize(items, session.answers);
  return { ...scored, total: items.length, answered: session.answers.length, unanswered: items.length - session.answers.length };
};
const historyItem = (session) => {
  const summary = sessionSummary(session);
  return { id: session.id, date: session.completedAt, route: session.route, mode: session.mode,
    correct: summary.correct, total: summary.total, answered: summary.answered, skills: summary.skills };
};

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function getToken(request) {
  const raw = request.headers.cookie || '';
  return raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
}

function requireProfile(store, request) {
  const token = getToken(request);
  const id = token && /^[a-f0-9]{64}$/.test(token) ? tokenHash(token) : null;
  if (!id || !store.read((data) => data.profiles[id])) throw new ApiError(401, 'Abre de nuevo la app para iniciar tu perfil local.');
  return id;
}

function ownSession(data, id, profileId) {
  const session = data.sessions[id];
  if (!session || session.profileId !== profileId) throw new ApiError(404, 'Sesión no encontrada.');
  return session;
}

export async function handleApi(request, response, pathname, store) {
  const send = (status, data, headers = {}) => {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
    response.end(JSON.stringify(data));
  };
  try {
    if (request.method === 'GET' && pathname === '/api/health') return send(200, { ok: true });
    if (request.method === 'GET' && pathname === '/api/bootstrap') {
      let token = getToken(request);
      let profileId = token && /^[a-f0-9]{64}$/.test(token) ? tokenHash(token) : null;
      let headers = {};
      if (!profileId || !store.read((data) => data.profiles[profileId])) {
        token = randomBytes(32).toString('hex');
        profileId = tokenHash(token);
        const id = profileId;
        await store.transact((data) => { data.profiles[id] = { createdAt: new Date().toISOString() }; });
        headers = { 'Set-Cookie': `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}` };
      }
      const sessions = store.read((data) => Object.values(data.sessions).filter((item) => item.profileId === profileId));
      const history = sessions.filter((item) => item.completedAt).map(historyItem).sort((a, b) => a.date.localeCompare(b.date));
      const active = sessions.filter((item) => !item.completedAt).sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
      return send(200, { history, active: active ? {
        id: active.id, route: active.route, mode: active.mode, skill: active.skill,
        items: active.questionIds.map((id) => publicQuestion(questionById.get(id))), answers: active.answers,
        deadlineAt: active.deadlineAt,
      } : null, skills: Object.fromEntries(Object.keys(routes).map((route) => [route, [...new Set(questions.filter((item) => item.route === route).map((item) => item.skill))]])) }, headers);
    }
    const profileId = requireProfile(store, request);
    if (request.method === 'POST') {
      const origin = request.headers.origin;
      if (origin && origin !== `http://${request.headers.host}` && origin !== `https://${request.headers.host}`) throw new ApiError(403, 'Origen no permitido.');
      if (!request.headers['content-type']?.startsWith('application/json')) throw new ApiError(415, 'Se requiere JSON.');
    }
    if (request.method === 'POST' && pathname === '/api/sessions') {
      const { route, mode, skill = 'Todas' } = await readJson(request);
      if (!routes[route] || !MODES[mode] || typeof skill !== 'string') throw new ApiError(400, 'Ruta o modo no válido.');
      const items = selectQuestions(questions, route, mode, skill);
      if (!items.length) throw new ApiError(400, 'No hay preguntas disponibles para esta selección.');
      const startedAt = new Date().toISOString();
      const session = { id: randomUUID(), profileId, route, mode, skill, questionIds: items.map((item) => item.id), answers: [], startedAt,
        deadlineAt: mode === 'simulacro' ? new Date(Date.now() + 300000).toISOString() : null, completedAt: null };
      await store.transact((data) => { data.sessions[session.id] = session; });
      return send(201, { id: session.id, route, mode, skill, items: items.map(publicQuestion), answers: [], deadlineAt: session.deadlineAt });
    }
    const match = pathname.match(/^\/api\/sessions\/([0-9a-f-]+)\/(answers|finish)$/);
    if (match && request.method === 'POST') {
      const [, id, operation] = match;
      const body = await readJson(request);
      const result = await store.transact((data) => {
        const session = ownSession(data, id, profileId);
        if (session.completedAt) throw new ApiError(409, 'Esta sesión ya terminó.');
        const expired = session.deadlineAt && Date.now() >= Date.parse(session.deadlineAt);
        if (operation === 'answers') {
          if (expired) throw new ApiError(409, 'Se acabó el tiempo. Finaliza la sesión.');
          const question = questionById.get(session.questionIds[session.answers.length]);
          if (!question || body.questionId !== question.id) throw new ApiError(409, 'La respuesta no corresponde a la pregunta actual.');
          let outcome;
          try { outcome = evaluate(question, body.selectedIndex); }
          catch { throw new ApiError(400, 'Respuesta no válida.'); }
          session.answers.push({ questionId: question.id, selectedIndex: body.selectedIndex });
          if (session.answers.length === session.questionIds.length) {
            session.completedAt = new Date().toISOString();
            return { completed: true, summary: sessionSummary(session), history: historyItem(session) };
          }
          return session.mode === 'practica' ? { completed: false, feedback: { ...outcome, explanation: question.explanation, nextStep: question.nextStep } } : { completed: false };
        }
        session.completedAt = new Date().toISOString();
        return { completed: true, summary: sessionSummary(session), history: historyItem(session) };
      });
      return send(200, result);
    }
    throw new ApiError(404, 'Ruta no encontrada.');
  } catch (error) {
    if (!(error instanceof ApiError)) console.error(error);
    return send(error.status || 500, { error: error.status ? error.message : 'Ocurrió un error en el servidor.' });
  }
}

async function readJson(request) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 16384) throw new ApiError(413, 'Solicitud demasiado grande.');
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch { throw new ApiError(400, 'JSON no válido.'); }
}
