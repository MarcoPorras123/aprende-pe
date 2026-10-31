export const MODES = {
  practica: { label: 'Práctica', description: 'Corrige cada respuesta al instante y aprende por qué.' },
  diagnostico: { label: 'Quiero probarme', description: 'Responde sin pistas. Revisarás el resultado al final.' },
  simulacro: { label: 'Mini simulacro', description: 'Responde con tiempo; verás las explicaciones al terminar.' },
};

export function selectQuestions(pool, route, mode, skill = 'Todas') {
  if (!['frances', 'preuni'].includes(route) || !MODES[mode]) return [];
  const routeItems = pool.filter((item) => item.route === route);
  if (mode === 'practica' && skill !== 'Todas') {
    return routeItems.filter((item) => item.skill === skill).slice(0, 5);
  }
  const groups = new Map();
  for (const item of routeItems) groups.set(item.skill, [...(groups.get(item.skill) || []), item]);
  const chosen = [];
  while (chosen.length < 5 && [...groups.values()].some((group) => group.length)) {
    for (const group of groups.values()) {
      if (group.length && chosen.length < 5) chosen.push(group.shift());
    }
  }
  return chosen;
}

export function evaluate(question, selectedIndex) {
  if (!question || !Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= question.options.length) {
    throw new Error('Respuesta no válida');
  }
  return {
    questionId: question.id,
    skill: question.skill,
    selectedIndex,
    correctIndex: question.correctIndex,
    correct: selectedIndex === question.correctIndex,
  };
}

export function shouldShowImmediateFeedback(mode) {
  return mode === 'practica';
}

export function summarize(questions, answers) {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const outcomes = answers.map((answer) => {
    const question = byId.get(answer.questionId);
    if (!question) throw new Error('Pregunta desconocida');
    return { ...evaluate(question, answer.selectedIndex), question };
  });
  const skills = {};
  for (const outcome of outcomes) {
    const skill = skills[outcome.skill] ?? { correct: 0, total: 0 };
    skill.total += 1;
    if (outcome.correct) skill.correct += 1;
    skills[outcome.skill] = skill;
  }
  return { correct: outcomes.filter((outcome) => outcome.correct).length, total: outcomes.length, outcomes, skills };
}
