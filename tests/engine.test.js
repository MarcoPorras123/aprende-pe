import test from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../web/questions.js';
import { selectQuestions, evaluate, shouldShowImmediateFeedback, summarize } from '../web/engine.js';

test('la práctica filtra por ruta y habilidad; el diagnóstico mezcla las disponibles', () => {
  const practice = selectQuestions(questions, 'frances', 'practica', 'Gramática');
  assert.ok(practice.length > 0);
  assert.ok(practice.every((question) => question.route === 'frances' && question.skill === 'Gramática'));

  const diagnostic = selectQuestions(questions, 'frances', 'diagnostico', 'Gramática');
  assert.equal(diagnostic.length, 5);
  assert.ok(new Set(diagnostic.map((question) => question.skill)).size > 1);
  assert.equal(selectQuestions(questions, 'otra', 'practica').length, 0);
});

test('una clave revisada determina el acierto y se rechazan respuestas inválidas', () => {
  const question = questions[0];
  assert.equal(evaluate(question, question.correctIndex).correct, true);
  assert.equal(evaluate(question, 0).correct, false);
  assert.throws(() => evaluate(question, 99), /Respuesta no válida/);
});

test('solo la práctica muestra corrección tras cada respuesta', () => {
  assert.equal(shouldShowImmediateFeedback('practica'), true);
  assert.equal(shouldShowImmediateFeedback('diagnostico'), false);
  assert.equal(shouldShowImmediateFeedback('simulacro'), false);
});

test('el resumen usa únicamente respuestas enviadas y conserva evidencia por habilidad', () => {
  const items = [questions[0], questions[3]];
  const summary = summarize(items, [
    { questionId: items[0].id, selectedIndex: items[0].correctIndex },
    { questionId: items[1].id, selectedIndex: 1 },
  ]);
  assert.equal(summary.correct, 1);
  assert.equal(summary.total, 2);
  assert.deepEqual(summary.skills.Gramática, { correct: 1, total: 1 });
  assert.deepEqual(summary.skills.Lectura, { correct: 0, total: 1 });
});
