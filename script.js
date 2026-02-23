const LEVELS = ['easy', 'medium', 'hard'];
const QUESTIONS_PER_LEVEL = 20;
const MISSIONS_COUNT = 100;

const state = {
  score: 0,
  level: 'easy',
  levelIndex: 0,
  levelSets: {
    easy: createLevelQuestions('easy'),
    medium: createLevelQuestions('medium'),
    hard: createLevelQuestions('hard'),
  },
  daily: null,
  dailySolvedDates: new Set(),
  missionIndex: 0,
  missions: createMissions(MISSIONS_COUNT),
};

const scoreEl = document.getElementById('score');
const levelQuestionEl = document.getElementById('level-question');
const levelHintEl = document.getElementById('level-hint');
const levelFeedbackEl = document.getElementById('level-feedback');
const currentLevelEl = document.getElementById('current-level');
const levelIndexEl = document.getElementById('level-index');
const levelAnswerEl = document.getElementById('level-answer');
const levelButtons = [...document.querySelectorAll('.level-btn')];

const dailyDateEl = document.getElementById('challenge-date');
const dailyQuestionEl = document.getElementById('daily-question');
const dailyHintEl = document.getElementById('daily-hint');
const dailyFeedbackEl = document.getElementById('daily-feedback');
const dailyAnswerEl = document.getElementById('daily-answer');

const missionQuestionEl = document.getElementById('mission-question');
const missionHintEl = document.getElementById('mission-hint');
const missionFeedbackEl = document.getElementById('mission-feedback');
const missionNumberEl = document.getElementById('mission-number');
const missionCompletedEl = document.getElementById('mission-completed');
const missionAnswerEl = document.getElementById('mission-answer');

function init() {
  dailyDateEl.valueAsDate = new Date();
  loadDailyChallenge();
  renderLevelQuestion();
  renderMission();
  updateScore();
}

levelButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    state.level = btn.dataset.level;
    state.levelIndex = 0;
    levelButtons.forEach((x) => x.classList.remove('active'));
    btn.classList.add('active');
    clearFeedback(levelFeedbackEl, levelHintEl);
    renderLevelQuestion();
  });
});

document.getElementById('prev-question').addEventListener('click', () => {
  state.levelIndex = Math.max(0, state.levelIndex - 1);
  clearFeedback(levelFeedbackEl, levelHintEl);
  renderLevelQuestion();
});

document.getElementById('next-question').addEventListener('click', () => {
  state.levelIndex = Math.min(QUESTIONS_PER_LEVEL - 1, state.levelIndex + 1);
  clearFeedback(levelFeedbackEl, levelHintEl);
  renderLevelQuestion();
});

document.getElementById('level-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = currentLevelQuestion();
  const guess = Number(levelAnswerEl.value);
  if (Number.isNaN(guess)) return;

  const firstCompletion = !q.completed;
  q.completed = true;

  if (Math.abs(guess - q.answer) < 0.001) {
    q.correct = true;
    setFeedback(levelFeedbackEl, 'Correct! Great job 🎉', 'ok');
  } else {
    setFeedback(levelFeedbackEl, `Not correct. Answer: ${fmt(q.answer)}`, 'bad');
  }

  if (firstCompletion) addPoints(5);
});

document.getElementById('hint-btn').addEventListener('click', () => {
  useHint(currentLevelQuestion(), levelHintEl, levelFeedbackEl);
});

dailyDateEl.addEventListener('change', () => {
  clearFeedback(dailyFeedbackEl, dailyHintEl);
  loadDailyChallenge();
});

document.getElementById('daily-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!state.daily) return;
  const guess = Number(dailyAnswerEl.value);
  if (Number.isNaN(guess)) return;

  const dateKey = state.daily.date;
  const firstCompletion = !state.dailySolvedDates.has(dateKey);

  if (Math.abs(guess - state.daily.answer) < 0.001) {
    setFeedback(dailyFeedbackEl, 'Daily challenge solved! ✅', 'ok');
  } else {
    setFeedback(dailyFeedbackEl, `Not yet. Correct answer: ${fmt(state.daily.answer)}`, 'bad');
  }

  if (firstCompletion) {
    state.dailySolvedDates.add(dateKey);
    addPoints(5);
  }
});

document.getElementById('daily-hint-btn').addEventListener('click', () => {
  if (!state.daily) return;
  useHint(state.daily, dailyHintEl, dailyFeedbackEl);
});

document.getElementById('prev-mission').addEventListener('click', () => {
  state.missionIndex = Math.max(0, state.missionIndex - 1);
  clearFeedback(missionFeedbackEl, missionHintEl);
  renderMission();
});

document.getElementById('next-mission').addEventListener('click', () => {
  state.missionIndex = Math.min(MISSIONS_COUNT - 1, state.missionIndex + 1);
  clearFeedback(missionFeedbackEl, missionHintEl);
  renderMission();
});

document.getElementById('mission-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const m = state.missions[state.missionIndex];
  const guess = Number(missionAnswerEl.value);
  if (Number.isNaN(guess)) return;

  const firstCompletion = !m.completed;
  m.completed = true;

  if (Math.abs(guess - m.answer) < 0.001) {
    m.correct = true;
    setFeedback(missionFeedbackEl, 'Mission completed! 🚀', 'ok');
  } else {
    setFeedback(missionFeedbackEl, `Not correct. Answer: ${fmt(m.answer)}`, 'bad');
  }

  if (firstCompletion) addPoints(5);
  renderMissionMeta();
});

document.getElementById('mission-hint-btn').addEventListener('click', () => {
  useHint(state.missions[state.missionIndex], missionHintEl, missionFeedbackEl);
});

function useHint(question, hintEl, feedbackEl) {
  if (state.score < 10) {
    setFeedback(feedbackEl, 'Not enough points for a hint. You need 10 points.', 'bad');
    return;
  }
  addPoints(-10);
  hintEl.textContent = `Hint: ${question.hint}`;
  setFeedback(feedbackEl, 'Hint unlocked (-10 points).', 'ok');
}

function renderLevelQuestion() {
  const q = currentLevelQuestion();
  currentLevelEl.textContent = cap(state.level);
  levelIndexEl.textContent = String(state.levelIndex + 1);
  levelQuestionEl.textContent = q.text;
  levelAnswerEl.value = '';
}

function currentLevelQuestion() {
  return state.levelSets[state.level][state.levelIndex];
}

function renderMission() {
  const m = state.missions[state.missionIndex];
  missionQuestionEl.textContent = m.text;
  missionNumberEl.textContent = String(state.missionIndex + 1);
  missionAnswerEl.value = '';
  renderMissionMeta();
}

function renderMissionMeta() {
  missionCompletedEl.textContent = String(state.missions.filter((m) => m.completed).length);
}

function loadDailyChallenge() {
  const date = dailyDateEl.value || new Date().toISOString().slice(0, 10);
  state.daily = createDailyQuestion(date);
  dailyQuestionEl.textContent = state.daily.text;
  dailyAnswerEl.value = '';
}

function addPoints(n) {
  state.score = Math.max(0, state.score + n);
  updateScore();
}

function updateScore() {
  scoreEl.textContent = String(state.score);
}

function setFeedback(el, message, type) {
  el.textContent = message;
  el.classList.remove('ok', 'bad');
  el.classList.add(type);
}

function clearFeedback(feedbackEl, hintEl) {
  feedbackEl.textContent = '';
  feedbackEl.classList.remove('ok', 'bad');
  hintEl.textContent = '';
}

function createLevelQuestions(level) {
  const arr = [];
  for (let i = 1; i <= QUESTIONS_PER_LEVEL; i += 1) {
    arr.push(makeQuestionByDifficulty(level, i));
  }
  return arr;
}

function createMissions(n) {
  const arr = [];
  for (let i = 1; i <= n; i += 1) {
    const a = 10 + i;
    const b = 4 + (i % 12);
    const c = 2 + (i % 7);
    arr.push({
      text: `Mission ${i}: A school buys ${a} notebooks at $${b} each and ${c} marker packs at $3 each. What is the total cost?`,
      answer: a * b + c * 3,
      hint: 'Multiply each item count by its price, then add both totals.',
      completed: false,
      correct: false,
    });
  }
  return arr;
}

function createDailyQuestion(dateStr) {
  const seed = [...dateStr].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const x = 10 + (seed % 35);
  const y = 3 + (seed % 9);
  const z = 2 + (seed % 6);
  return {
    date: dateStr,
    text: `For ${dateStr}, a café sells ${x} juices at $${y} each and ${z} pastries at $4 each. What is the total amount earned?`,
    answer: x * y + z * 4,
    hint: 'Find juice revenue and pastry revenue separately, then sum.',
  };
}

function makeQuestionByDifficulty(level, i) {
  if (level === 'easy') {
    const a = 4 + i;
    const b = 2 + (i % 6);
    return {
      text: `Easy Q${i}: Sam had ${a} candies and got ${b} more. How many candies now?`,
      answer: a + b,
      hint: 'Add the two numbers.',
      completed: false,
      correct: false,
    };
  }
  if (level === 'medium') {
    const packs = 3 + (i % 8);
    const each = 6 + i;
    const extra = 5 + (i % 10);
    return {
      text: `Medium Q${i}: A shop sold ${packs} packs with ${each} pens each, then sold ${extra} extra pens. How many pens in total?`,
      answer: packs * each + extra,
      hint: 'Multiply packs by pens per pack, then add extras.',
      completed: false,
      correct: false,
    };
  }
  const distance = 80 + i * 4;
  const speed = 20 + (i % 9) * 3;
  const breakMin = 10 + (i % 5) * 5;
  return {
    text: `Hard Q${i}: A bus travels ${distance} km at ${speed} km/h and takes a ${breakMin}-minute break. What is total trip time in minutes?`,
    answer: (distance / speed) * 60 + breakMin,
    hint: 'Time = distance ÷ speed; convert hours to minutes; add break.',
    completed: false,
    correct: false,
  };
}

function cap(s) { return s[0].toUpperCase() + s.slice(1); }
function fmt(n) { return Number.isInteger(n) ? n : Number(n.toFixed(2)); }

init();
