(function () {
  const ANSWER_TIME_MS = 5000;

  const state = {
    category: 'polska',
    difficulty: 'latwy',
    playerCount: 2,
    playerNames: [],
    players: [],
    currentPlayerIndex: 0,
    piles: { a: [], b: [] },
    activeQuestion: null,
    activePile: null,
    timerInterval: null,
    timeLeft: ANSWER_TIME_MS,
    answered: false,
  };

  // --- DOM refs ---
  const screens = {
    setup: document.getElementById('screen-setup'),
    game: document.getElementById('screen-game'),
    end: document.getElementById('screen-end'),
  };
  const categoryRow = document.getElementById('category-row');
  const difficultyRow = document.getElementById('difficulty-row');
  const playersCountEl = document.getElementById('players-count');
  const namesList = document.getElementById('names-list');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  const currentPlayerNameEl = document.getElementById('current-player-name');
  const scoresBar = document.getElementById('scores-bar');
  const pileA = document.getElementById('pile-a');
  const pileB = document.getElementById('pile-b');
  const pileACount = document.getElementById('pile-a-count');
  const pileBCount = document.getElementById('pile-b-count');
  const drawHint = document.getElementById('draw-hint');

  const questionOverlay = document.getElementById('question-overlay');
  const questionText = document.getElementById('question-text');
  const answersGrid = document.getElementById('answers-grid');
  const timerFill = document.getElementById('timer-fill');
  const timerNumber = document.getElementById('timer-number');
  const feedbackEl = document.getElementById('feedback');

  const finalScoresEl = document.getElementById('final-scores');
  const totalsEl = document.getElementById('totals-summary');
  const historyBody = document.getElementById('history-body');

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // --- Setup screen interactions ---
  categoryRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    categoryRow.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.category = btn.dataset.value;
  });

  difficultyRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    difficultyRow.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.value;
  });

  document.getElementById('players-minus').addEventListener('click', () => {
    state.playerCount = Math.max(2, state.playerCount - 1);
    playersCountEl.textContent = state.playerCount;
    renderNameInputs();
  });
  document.getElementById('players-plus').addEventListener('click', () => {
    state.playerCount = Math.min(8, state.playerCount + 1);
    playersCountEl.textContent = state.playerCount;
    renderNameInputs();
  });

  namesList.addEventListener('input', (e) => {
    const input = e.target.closest('.name-input');
    if (!input) return;
    state.playerNames[Number(input.dataset.index)] = input.value;
  });

  function renderNameInputs() {
    namesList.innerHTML = '';
    for (let i = 0; i < state.playerCount; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'name-input';
      input.maxLength = 20;
      input.placeholder = `Gracz ${i + 1}`;
      input.dataset.index = i;
      input.value = state.playerNames[i] || '';
      namesList.appendChild(input);
    }
  }
  renderNameInputs();

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', () => {
    showScreen('setup');
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    if (!confirm('Wrocic do ustawien? Postep biezacej gry zostanie utracony.')) return;
    stopTimer();
    questionOverlay.classList.add('hidden');
    showScreen('setup');
  });

  pileA.addEventListener('click', () => drawCard('a'));
  pileB.addEventListener('click', () => drawCard('b'));

  // --- Deck building ---
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function collectQuestions(category, difficulty) {
    const categories = category === 'mix' ? ['polska', 'swiat'] : [category];
    const difficulties = difficulty === 'mix' ? ['latwy', 'sredni', 'trudny'] : [difficulty];
    let pool = [];
    categories.forEach((c) => {
      difficulties.forEach((d) => {
        pool = pool.concat(QUESTIONS[c][d]);
      });
    });
    return pool;
  }

  function buildDeck() {
    const pool = collectQuestions(state.category, state.difficulty);
    const shuffled = shuffle(pool).map(shuffleOptions);
    const pileA = [];
    const pileB = [];
    shuffled.forEach((q, i) => (i % 2 === 0 ? pileA : pileB).push(q));
    return { a: pileA, b: pileB };
  }

  // --- Game flow ---
  function startGame() {
    state.players = Array.from({ length: state.playerCount }, (_, i) => ({
      name: (state.playerNames[i] || '').trim() || `Gracz ${i + 1}`,
      score: 0,
      history: [],
    }));
    state.currentPlayerIndex = 0;
    state.piles = buildDeck();
    showScreen('game');
    renderGameHeader();
    renderPiles();
  }

  function renderGameHeader() {
    const current = state.players[state.currentPlayerIndex];
    currentPlayerNameEl.textContent = current.name;
    scoresBar.innerHTML = state.players
      .map(
        (p, i) =>
          `<span class="score-chip${i === state.currentPlayerIndex ? ' current' : ''}">${p.name}: ${p.score}</span>`
      )
      .join('');
  }

  function renderPiles() {
    pileACount.textContent = state.piles.a.length;
    pileBCount.textContent = state.piles.b.length;
    pileA.disabled = state.piles.a.length === 0;
    pileB.disabled = state.piles.b.length === 0;

    if (state.piles.a.length === 0 && state.piles.b.length === 0) {
      endGame();
    }
  }

  function drawCard(pileKey) {
    if (state.piles[pileKey].length === 0) return;
    const question = state.piles[pileKey].pop();
    state.activeQuestion = question;
    state.activePile = pileKey;
    renderPiles();
    showQuestion(question);
  }

  function showQuestion(question) {
    state.answered = false;
    questionText.textContent = question.q;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    answersGrid.innerHTML = '';

    question.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => selectAnswer(idx));
      answersGrid.appendChild(btn);
    });

    questionOverlay.classList.remove('hidden');
    startTimer();
  }

  function startTimer() {
    state.timeLeft = ANSWER_TIME_MS;
    timerFill.style.transition = 'none';
    timerFill.style.transform = 'scaleX(1)';
    timerNumber.textContent = Math.ceil(state.timeLeft / 1000);
    // force reflow so the transition below applies cleanly
    void timerFill.offsetWidth;
    timerFill.style.transition = `transform ${ANSWER_TIME_MS}ms linear`;
    timerFill.style.transform = 'scaleX(0)';

    const startedAt = Date.now();
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, ANSWER_TIME_MS - elapsed);
      timerNumber.textContent = Math.ceil(remaining / 1000);
      if (remaining <= 0) {
        clearInterval(state.timerInterval);
        onTimeUp();
      }
    }, 100);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
  }

  function onTimeUp() {
    if (state.answered) return;
    state.answered = true;
    revealAnswer(-1);
    feedbackEl.textContent = 'Czas minal!';
    feedbackEl.classList.add('bad');
    recordAnswer(null, false);
    scheduleNextTurn();
  }

  function selectAnswer(idx) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();
    const correct = idx === state.activeQuestion.correct;
    revealAnswer(idx);
    if (correct) {
      state.players[state.currentPlayerIndex].score += 1;
      feedbackEl.textContent = 'Dobra odpowiedz!';
      feedbackEl.classList.add('good');
    } else {
      feedbackEl.textContent = 'Zla odpowiedz!';
      feedbackEl.classList.add('bad');
    }
    recordAnswer(state.activeQuestion.options[idx], correct);
    scheduleNextTurn();
  }

  function recordAnswer(chosenText, isCorrect) {
    state.players[state.currentPlayerIndex].history.push({
      question: state.activeQuestion.q,
      chosen: chosenText,
      isCorrect,
    });
  }

  function revealAnswer(chosenIdx) {
    const buttons = answersGrid.querySelectorAll('.answer-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === state.activeQuestion.correct) btn.classList.add('correct');
      else if (idx === chosenIdx) btn.classList.add('wrong');
    });
  }

  function scheduleNextTurn() {
    setTimeout(() => {
      questionOverlay.classList.add('hidden');
      if (state.piles.a.length === 0 && state.piles.b.length === 0) {
        endGame();
        return;
      }
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
      renderGameHeader();
    }, 1400);
  }

  function endGame() {
    stopTimer();
    questionOverlay.classList.add('hidden');
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    const topScore = sorted[0].score;
    finalScoresEl.innerHTML = sorted
      .map((p) => {
        const correct = p.history.filter((h) => h.isCorrect).length;
        const wrong = p.history.length - correct;
        return `<div class="final-score-row${p.score === topScore ? ' winner' : ''}">
          <span>${escapeHtml(p.name)}</span>
          <span class="score-detail">
            <span class="pts">${p.score} pkt</span>
            <span class="ok-count">${correct} ✓</span>
            <span class="bad-count">${wrong} ✗</span>
          </span>
        </div>`;
      })
      .join('');

    const totalCorrect = state.players.reduce((sum, p) => sum + p.history.filter((h) => h.isCorrect).length, 0);
    const totalWrong = state.players.reduce((sum, p) => sum + p.history.filter((h) => !h.isCorrect).length, 0);
    totalsEl.textContent = `Razem: ${totalCorrect} poprawnych, ${totalWrong} blednych`;

    renderHistoryTable();
    showScreen('end');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function renderHistoryTable() {
    const rows = [];
    state.players.forEach((p) => {
      p.history.forEach((h) => {
        rows.push({ player: p.name, ...h });
      });
    });
    historyBody.innerHTML = rows
      .map(
        (r, i) => `<tr class="${r.isCorrect ? 'row-good' : 'row-bad'}">
          <td>${i + 1}</td>
          <td>${escapeHtml(r.player)}</td>
          <td>${escapeHtml(r.question)}</td>
          <td>${escapeHtml(r.chosen || '(brak - czas minal)')}</td>
          <td>${r.isCorrect ? '✓' : '✗'}</td>
        </tr>`
      )
      .join('');
  }
})();
