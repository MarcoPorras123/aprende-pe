import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';

async function listeningServer(dataFile) {
  const server = await createApp({ dataFile });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

async function close(server) { await new Promise((resolve) => server.close(resolve)); }

test('la API oculta claves, corrige según modo y persiste tras reiniciar', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aprende-pe-test-'));
  const dataFile = join(dir, 'data.json');
  let { server, base } = await listeningServer(dataFile);
  try {
    const bootstrap = await fetch(`${base}/api/bootstrap`);
    assert.equal(bootstrap.status, 200);
    const cookie = bootstrap.headers.get('set-cookie').split(';')[0];
    assert.ok(cookie.startsWith('aprende_pe_guest='));
    const call = async (path, body, cookieValue = cookie) => {
      const response = await fetch(`${base}${path}`, { method: 'POST', headers: { Cookie: cookieValue, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    const practice = await call('/api/sessions', { route: 'frances', mode: 'practica', skill: 'Gramática' });
    assert.equal(practice.status, 201);
    assert.ok(practice.body.items.length > 0);
    assert.equal(JSON.stringify(practice.body).includes('correctIndex'), false);
    assert.equal(JSON.stringify(practice.body).includes('explanation'), false);
    const first = practice.body.items[0];
    const answer = await call(`/api/sessions/${practice.body.id}/answers`, { questionId: first.id, selectedIndex: 0 });
    assert.equal(answer.status, 200);
    assert.equal(typeof answer.body.feedback.correct, 'boolean');
    const repeat = await call(`/api/sessions/${practice.body.id}/answers`, { questionId: first.id, selectedIndex: 0 });
    assert.equal(repeat.status, 409);
    const finish = await call(`/api/sessions/${practice.body.id}/finish`, {});
    assert.equal(finish.status, 200);
    assert.equal(finish.body.summary.answered, 1);
    assert.equal(finish.body.history.route, 'frances');
    const otherGuest = await call(`/api/sessions/${practice.body.id}/finish`, {}, 'aprende_pe_guest=' + 'f'.repeat(64));
    assert.equal(otherGuest.status, 401);
    const forbiddenAsset = await fetch(`${base}/questions.js`);
    assert.equal(forbiddenAsset.status, 404);

    await close(server);
    ({ server, base } = await listeningServer(dataFile));
    const restored = await fetch(`${base}/api/bootstrap`, { headers: { Cookie: cookie } }).then((response) => response.json());
    assert.equal(restored.history.length, 1);
    assert.equal(restored.history[0].answered, 1);
    assert.equal(Object.keys(JSON.parse(await readFile(dataFile, 'utf8')).sessions).length, 1);
  } finally {
    await close(server);
    await rm(dataFile, { force: true });
    await rmdir(dir);
  }
});

test('el diagnóstico reserva la corrección para el final', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'aprende-pe-test-'));
  const dataFile = join(dir, 'data.json');
  const { server, base } = await listeningServer(dataFile);
  try {
    const response = await fetch(`${base}/api/bootstrap`);
    const cookie = response.headers.get('set-cookie').split(';')[0];
    const post = async (path, body) => fetch(`${base}${path}`, { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((res) => res.json());
    const session = await post('/api/sessions', { route: 'preuni', mode: 'diagnostico' });
    const first = await post(`/api/sessions/${session.id}/answers`, { questionId: session.items[0].id, selectedIndex: 0 });
    assert.deepEqual(first, { completed: false });
    const result = await post(`/api/sessions/${session.id}/finish`, {});
    assert.equal(result.summary.outcomes.length, 1);
    assert.equal(typeof result.summary.outcomes[0].question.explanation, 'string');
  } finally {
    await close(server);
    await rm(dataFile, { force: true });
    await rmdir(dir);
  }
});
