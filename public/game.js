(function () {
  const state = {
    categoryA: 'polska',
    categoryB: 'swiat',
    difficulty: 'latwy',
    answerTimeMs: 15000,
    playerCount: 2,
    playerNames: [],
    players: [],
    currentPlayerIndex: 0,
    piles: { a: [], b: [] },
    activeQuestion: null,
    activePile: null,
    timerInterval: null,
    timeLeft: 15000,
    answered: false,
  };

  // --- DOM refs ---
  const showScreen = window.showScreen;
  const categoryASelect = document.getElementById('category-a-select');
  const categoryBSelect = document.getElementById('category-b-select');
  const difficultyRow = document.getElementById('difficulty-row');
  const answerTimeRow = document.getElementById('answer-time-row');
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
  const pileACat = document.getElementById('pile-a-cat');
  const pileBCat = document.getElementById('pile-b-cat');
  const drawHint = document.getElementById('draw-hint');

  const questionOverlay = document.getElementById('question-overlay');
  const questionCategoryEl = document.getElementById('question-category');
  const questionText = document.getElementById('question-text');
  const answersGrid = document.getElementById('answers-grid');
  const timerFill = document.getElementById('timer-fill');
  const timerNumber = document.getElementById('timer-number');
  const feedbackEl = document.getElementById('feedback');

  const finalScoresEl = document.getElementById('final-scores');
  const totalsEl = document.getElementById('totals-summary');
  const historyBody = document.getElementById('history-body');

  // --- Setup screen interactions ---
  categoryASelect.addEventListener('change', () => {
    state.categoryA = categoryASelect.value;
  });
  categoryBSelect.addEventListener('change', () => {
    state.categoryB = categoryBSelect.value;
  });

  document.getElementById('random-game-btn').addEventListener('click', () => {
    categoryASelect.value = 'losowa';
    categoryBSelect.value = 'losowa';
    state.categoryA = 'losowa';
    state.categoryB = 'losowa';
    startGame();
  });

  difficultyRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    difficultyRow.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.value;
  });

  answerTimeRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.choice-btn');
    if (!btn) return;
    answerTimeRow.querySelectorAll('.choice-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    state.answerTimeMs = Number(btn.dataset.value) * 1000;
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
    showScreen('screen-setup');
  });

  document.getElementById('back-btn').addEventListener('click', () => {
    if (!confirm('Wrocic do ustawien? Postep biezacej gry zostanie utracony.')) return;
    stopTimer();
    questionOverlay.classList.add('hidden');
    showScreen('screen-setup');
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
    // "losowa" losuje kategorie osobno dla kazdego pytania, wiec zmienia sie co kolejke.
    const categories = category === 'mix' || category === 'losowa' ? Object.keys(QUESTIONS) : [category];
    const difficulties = difficulty === 'mix' ? ['latwy', 'sredni', 'trudny'] : [difficulty];
    let pool = [];
    categories.forEach((c) => {
      difficulties.forEach((d) => {
        pool = pool.concat(QUESTIONS[c][d].map((q) => ({ ...q, sourceCategory: c })));
      });
    });
    return pool;
  }

  // Tasuje pule tak, by pytania dawno niezadawane trafily na wierzch talii
  // (dobieramy przez pop(), wiec wierzch to koniec tablicy).
  function shuffleFreshFirst(pool, recent) {
    const seen = shuffle(pool.filter((q) => recent.has(q.q)));
    const fresh = shuffle(pool.filter((q) => !recent.has(q.q)));
    return seen.concat(fresh);
  }

  // Buduje obie talie naraz, pilnujac by to samo pytanie nie trafilo do obu
  // (przy kategorii "mix"/"losowa" obie talie czerpia z tej samej puli).
  function buildDeck() {
    const recent = window.loadRecentQuestions();
    const poolA = shuffleFreshFirst(collectQuestions(state.categoryA, state.difficulty), recent);
    const poolB = shuffleFreshFirst(collectQuestions(state.categoryB, state.difficulty), recent);

    const used = new Set();
    const a = [];
    const b = [];
    let ia = 0;
    let ib = 0;
    // Rozdajemy na przemian, pomijajac pytania juz przydzielone drugiej talii.
    while (ia < poolA.length || ib < poolB.length) {
      while (ia < poolA.length && used.has(poolA[ia].q)) ia += 1;
      if (ia < poolA.length) {
        used.add(poolA[ia].q);
        a.push(poolA[ia]);
        ia += 1;
      }
      while (ib < poolB.length && used.has(poolB[ib].q)) ib += 1;
      if (ib < poolB.length) {
        used.add(poolB[ib].q);
        b.push(poolB[ib]);
        ib += 1;
      }
    }
    return { a: a.map(shuffleOptions), b: b.map(shuffleOptions) };
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
    showScreen('screen-game');
    renderGameHeader();
    renderPiles();
  }

  function renderGameHeader() {
    const current = state.players[state.currentPlayerIndex];
    currentPlayerNameEl.textContent = current.name;
    scoresBar.innerHTML = state.players
      .map((p, i) => {
        const correct = p.history.filter((h) => h.isCorrect).length;
        const wrong = p.history.length - correct;
        return `<tr class="${i === state.currentPlayerIndex ? 'current' : ''}"><td>${escapeHtml(p.name)}</td><td>${correct}</td><td>${wrong}</td></tr>`;
      })
      .join('');
  }

  // Kategoria karty lezacej na wierzchu talii - ta, ktora gracz dostanie po kliknieciu.
  function peekCategoryLabel(pileKey) {
    const pile = state.piles[pileKey];
    if (!pile.length) return '-';
    return window.CATEGORY_LABELS[pile[pile.length - 1].sourceCategory] || '-';
  }

  function renderPiles() {
    pileACount.textContent = state.piles.a.length;
    pileBCount.textContent = state.piles.b.length;
    pileACat.textContent = peekCategoryLabel('a');
    pileBCat.textContent = peekCategoryLabel('b');
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
    window.rememberQuestions([question.q]);
    renderPiles();
    showQuestion(question);
  }

  function showQuestion(question) {
    state.answered = false;
    questionCategoryEl.textContent = window.CATEGORY_LABELS[question.sourceCategory] || '';
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
    const totalMs = state.answerTimeMs;
    state.timeLeft = totalMs;
    state.lowTimeAlerted = false;
    timerFill.style.transition = 'none';
    timerFill.style.transform = 'scaleX(1)';
    timerNumber.textContent = Math.ceil(state.timeLeft / 1000);
    // force reflow so the transition below applies cleanly
    void timerFill.offsetWidth;
    timerFill.style.transition = `transform ${totalMs}ms linear`;
    timerFill.style.transform = 'scaleX(0)';

    const startedAt = Date.now();
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, totalMs - elapsed);
      timerNumber.textContent = Math.ceil(remaining / 1000);
      if (remaining <= 1000 && !state.lowTimeAlerted) {
        state.lowTimeAlerted = true;
        window.beepAndVibrate();
      }
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
      if (idx === state.activeQuestion.correct) {
        btn.classList.add('correct');
        if (idx === chosenIdx) window.celebrateAt(btn);
      } else if (idx === chosenIdx) {
        btn.classList.add('wrong');
        window.explodeAt(btn);
      }
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
    window.recordGameResult(sorted.map((p) => ({ name: p.name, score: p.score })));
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
    showScreen('screen-end');
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
