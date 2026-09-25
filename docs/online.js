(function () {
  const showScreen = window.showScreen;

  const state = {
    ws: null,
    myId: null,
    myName: '',
    categoryA: 'polska',
    categoryB: 'swiat',
    difficulty: 'latwy',
    answerTimeMs: 15000,
    players: [],
    currentPlayerId: null,
    hostId: null,
    activeCorrectIdx: null,
    answered: false,
    timerInterval: null,
    history: [],
    liveStats: {},
  };

  // --- DOM refs ---
  const nameInput = document.getElementById('online-name-input');
  const tabCreateBtn = document.getElementById('tab-create-btn');
  const tabJoinBtn = document.getElementById('tab-join-btn');
  const panelCreate = document.getElementById('panel-create');
  const panelJoin = document.getElementById('panel-join');
  const categoryASelect = document.getElementById('online-category-a-select');
  const categoryBSelect = document.getElementById('online-category-b-select');
  const difficultyRow = document.getElementById('online-difficulty-row');
  const answerTimeRow = document.getElementById('online-answer-time-row');
  const createRoomBtn = document.getElementById('create-room-btn');
  const joinCodeInput = document.getElementById('join-code-input');
  const joinRoomBtn = document.getElementById('join-room-btn');
  const onlineError = document.getElementById('online-error');

  const roomCodeValue = document.getElementById('room-code-value');
  const lobbyCount = document.getElementById('lobby-count');
  const lobbyPlayers = document.getElementById('lobby-players');
  const lobbyWaitHint = document.getElementById('lobby-wait-hint');
  const lobbyStartBtn = document.getElementById('lobby-start-btn');
  const lobbyBackBtn = document.getElementById('lobby-back-btn');

  const turnIndicator = document.getElementById('online-turn-indicator');
  const currentPlayerNameEl = document.getElementById('online-current-player-name');
  const scoresBar = document.getElementById('online-scores-bar');
  const pileA = document.getElementById('online-pile-a');
  const pileB = document.getElementById('online-pile-b');
  const pileACount = document.getElementById('online-pile-a-count');
  const pileBCount = document.getElementById('online-pile-b-count');
  const pileACat = document.getElementById('online-pile-a-cat');
  const pileBCat = document.getElementById('online-pile-b-cat');
  const drawHint = document.getElementById('online-draw-hint');
  const onlineBackBtn = document.getElementById('online-back-btn');

  const questionOverlay = document.getElementById('online-question-overlay');
  const answeringAs = document.getElementById('answering-as');
  const questionCategoryEl = document.getElementById('online-question-category');
  const questionText = document.getElementById('online-question-text');
  const answersGrid = document.getElementById('online-answers-grid');
  const timerFill = document.getElementById('online-timer-fill');
  const timerNumber = document.getElementById('online-timer-number');
  const feedbackEl = document.getElementById('online-feedback');

  const finalScoresEl = document.getElementById('online-final-scores');
  const historyBody = document.getElementById('online-history-body');
  const restartBtn = document.getElementById('online-restart-btn');

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function showError(msg) {
    onlineError.textContent = msg;
  }

  // --- Tabs (stworz / dolacz) ---
  tabCreateBtn.addEventListener('click', () => {
    tabCreateBtn.classList.add('active');
    tabJoinBtn.classList.remove('active');
    panelCreate.classList.remove('hidden');
    panelJoin.classList.add('hidden');
    showError('');
  });
  tabJoinBtn.addEventListener('click', () => {
    tabJoinBtn.classList.add('active');
    tabCreateBtn.classList.remove('active');
    panelJoin.classList.remove('hidden');
    panelCreate.classList.add('hidden');
    showError('');
  });

  categoryASelect.addEventListener('change', () => {
    state.categoryA = categoryASelect.value;
  });
  categoryBSelect.addEventListener('change', () => {
    state.categoryB = categoryBSelect.value;
  });

  document.getElementById('online-random-game-btn').addEventListener('click', () => {
    categoryASelect.value = 'losowa';
    categoryBSelect.value = 'losowa';
    state.categoryA = 'losowa';
    state.categoryB = 'losowa';
    createRoomBtn.click();
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

  // --- Polaczenie WebSocket ---
  function connect(onOpen) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) {
      onOpen();
      return;
    }
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${location.host}`);
    state.ws = ws;

    ws.addEventListener('open', onOpen);
    ws.addEventListener('message', (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      handleMessage(msg);
    });
    ws.addEventListener('close', () => {
      if (document.getElementById('screen-lobby').classList.contains('active') ||
          document.getElementById('screen-online-game').classList.contains('active')) {
        alert('Polaczenie z serwerem zostalo przerwane.');
        showScreen('screen-mode');
      }
    });
    ws.addEventListener('error', () => {
      showError('Nie udalo sie polaczyc z serwerem online. Sprobuj ponownie.');
    });
  }

  function send(msg) {
    if (state.ws && state.ws.readyState === WebSocket.OPEN) state.ws.send(JSON.stringify(msg));
  }

  createRoomBtn.addEventListener('click', () => {
    state.myName = nameInput.value.trim();
    if (!state.myName) {
      showError('Podaj swoje imie.');
      return;
    }
    showError('');
    connect(() => {
      send({ type: 'create', name: state.myName, categoryA: state.categoryA, categoryB: state.categoryB, difficulty: state.difficulty, answerTimeMs: state.answerTimeMs });
    });
  });

  joinRoomBtn.addEventListener('click', () => {
    state.myName = nameInput.value.trim();
    const code = joinCodeInput.value.trim().toUpperCase();
    if (!state.myName) {
      showError('Podaj swoje imie.');
      return;
    }
    if (!code) {
      showError('Podaj kod pokoju.');
      return;
    }
    showError('');
    connect(() => {
      send({ type: 'join', name: state.myName, code });
    });
  });

  function handleMessage(msg) {
    switch (msg.type) {
      case 'created':
      case 'joined':
        state.myId = msg.playerId;
        applyRoomState(msg.state);
        showScreen('screen-lobby');
        break;
      case 'error':
        showError(msg.message);
        break;
      case 'room_update':
        applyRoomState(msg.state);
        renderLobby();
        break;
      case 'game_start':
        state.liveStats = {};
        applyRoomState(msg.state);
        questionOverlay.classList.add('hidden');
        showScreen('screen-online-game');
        renderGameHeader();
        renderPiles();
        break;
      case 'question':
        showQuestion(msg);
        break;
      case 'answer_result':
        handleAnswerResult(msg);
        break;
      case 'turn_change':
        applyRoomState(msg.state);
        questionOverlay.classList.add('hidden');
        renderGameHeader();
        renderPiles();
        break;
      case 'game_over':
        state.players = msg.players;
        state.history = msg.history;
        renderEnd();
        break;
      case 'opponent_left':
        applyRoomState(msg.state);
        if (document.getElementById('screen-lobby').classList.contains('active')) {
          renderLobby();
        } else if (document.getElementById('screen-online-game').classList.contains('active')) {
          renderGameHeader();
          renderPiles();
        }
        break;
    }
  }

  function applyRoomState(s) {
    if (!s) return;
    if (s.code) roomCodeValue.textContent = s.code;
    state.players = s.players;
    state.currentPlayerId = s.currentPlayerId;
    state.hostId = s.hostId;
    if (s.pileCounts) {
      pileACount.textContent = s.pileCounts.a;
      pileBCount.textContent = s.pileCounts.b;
      pileA.disabled = s.pileCounts.a === 0 || state.currentPlayerId !== state.myId;
      pileB.disabled = s.pileCounts.b === 0 || state.currentPlayerId !== state.myId;
    }
    if (s.nextCategories) renderPileCategories(s.nextCategories);
    renderLobby();
  }

  function renderLobby() {
    lobbyCount.textContent = state.players.length;
    lobbyPlayers.innerHTML = state.players
      .map((p) => `<div class="lobby-player${p.id === state.myId ? ' me' : ''}${p.id === state.hostId ? ' host' : ''}">
        <span>${escapeHtml(p.name)}${p.id === state.myId ? ' (Ty)' : ''}</span>
        ${p.id === state.hostId ? '<span class="host-tag">Host</span>' : ''}
      </div>`)
      .join('');

    const isHost = state.myId === state.hostId;
    const canStart = isHost && state.players.length >= 2;
    lobbyStartBtn.classList.toggle('hidden', !isHost);
    lobbyStartBtn.disabled = !canStart;
    lobbyWaitHint.classList.toggle('hidden', isHost);
    if (!isHost) {
      lobbyWaitHint.textContent = state.players.length < 2
        ? 'Czekamy na wiecej graczy (min. 2)...'
        : 'Czekamy, az host rozpocznie gre...';
    }
  }

  lobbyStartBtn.addEventListener('click', () => {
    send({ type: 'start' });
  });

  lobbyBackBtn.addEventListener('click', () => {
    if (!confirm('Opuscic pokoj?')) return;
    if (state.ws) state.ws.close();
    showScreen('screen-mode');
  });

  onlineBackBtn.addEventListener('click', () => {
    if (!confirm('Opuscic gre? Postep zostanie utracony.')) return;
    if (state.ws) state.ws.close();
    showScreen('screen-mode');
  });

  restartBtn.addEventListener('click', () => {
    if (state.ws) state.ws.close();
    showScreen('screen-mode');
  });

  // --- Rozgrywka ---
  function renderGameHeader() {
    const current = state.players.find((p) => p.id === state.currentPlayerId);
    currentPlayerNameEl.textContent = current ? current.name + (current.id === state.myId ? ' (Ty)' : '') : '-';
    renderScoresTable();
    const myTurn = state.currentPlayerId === state.myId;
    drawHint.textContent = myTurn ? 'Twoja tura - wybierz talie' : 'Czekaj na swoja ture...';
  }

  // Etykiety talii pokazuja kategorie karty na wierzchu - ta, ktora gracz dostanie po kliknieciu.
  function renderPileCategories(nextCategories) {
    pileACat.textContent = window.CATEGORY_LABELS[nextCategories.a] || '-';
    pileBCat.textContent = window.CATEGORY_LABELS[nextCategories.b] || '-';
  }

  function renderPiles() {
    const myTurn = state.currentPlayerId === state.myId;
    pileA.disabled = !myTurn || pileACount.textContent === '0';
    pileB.disabled = !myTurn || pileBCount.textContent === '0';
  }

  pileA.addEventListener('click', () => send({ type: 'draw', pile: 'a' }));
  pileB.addEventListener('click', () => send({ type: 'draw', pile: 'b' }));

  function showQuestion(msg) {
    state.answered = false;
    state.activeCorrectIdx = null;
    if (msg.nextCategories) renderPileCategories(msg.nextCategories);
    pileACount.textContent = msg.pileCounts.a;
    pileBCount.textContent = msg.pileCounts.b;
    pileA.disabled = true;
    pileB.disabled = true;

    const asker = state.players.find((p) => p.id === msg.currentPlayerId);
    const myTurn = msg.currentPlayerId === state.myId;
    answeringAs.textContent = myTurn ? 'Twoja kolej na odpowiedz!' : `Odpowiada: ${asker ? asker.name : '...'}`;

    questionCategoryEl.textContent = window.CATEGORY_LABELS[msg.question.sourceCategory] || '';
    questionText.textContent = msg.question.q;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    answersGrid.innerHTML = '';

    msg.question.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      if (!myTurn) btn.disabled = true;
      btn.addEventListener('click', () => {
        if (state.answered || !myTurn) return;
        state.answered = true;
        send({ type: 'answer', idx });
        disableAnswerButtons();
      });
      answersGrid.appendChild(btn);
    });

    questionOverlay.classList.remove('hidden');
    startTimer(msg.deadline, msg.answerTimeMs);
  }

  function disableAnswerButtons() {
    answersGrid.querySelectorAll('.answer-btn').forEach((b) => (b.disabled = true));
  }

  function startTimer(deadline, totalMs) {
    clearInterval(state.timerInterval);
    const total = totalMs || 15000;
    state.lowTimeAlerted = false;
    function tick() {
      const remaining = Math.max(0, deadline - Date.now());
      timerNumber.textContent = Math.ceil(remaining / 1000);
      timerFill.style.transform = `scaleX(${remaining / total})`;
      if (remaining <= 1000 && !state.lowTimeAlerted) {
        state.lowTimeAlerted = true;
        window.beepAndVibrate();
      }
      if (remaining <= 0) clearInterval(state.timerInterval);
    }
    timerFill.style.transition = 'none';
    tick();
    void timerFill.offsetWidth;
    timerFill.style.transition = 'transform 0.1s linear';
    state.timerInterval = setInterval(tick, 100);
  }

  function handleAnswerResult(msg) {
    clearInterval(state.timerInterval);
    state.players = msg.players;
    disableAnswerButtons();
    const buttons = [...answersGrid.querySelectorAll('.answer-btn')];
    buttons.forEach((btn, idx) => {
      if (idx === msg.correctIdx) {
        btn.classList.add('correct');
        if (idx === msg.chosenIdx) window.celebrateAt(btn);
      } else if (idx === msg.chosenIdx) {
        btn.classList.add('wrong');
        window.explodeAt(btn);
      }
    });
    const responder = state.players.find((p) => p.id === msg.playerId);
    const isMe = msg.playerId === state.myId;
    if (msg.playerId) {
      const stats = state.liveStats[msg.playerId] || { correct: 0, wrong: 0 };
      if (msg.correct) stats.correct += 1;
      else stats.wrong += 1;
      state.liveStats[msg.playerId] = stats;
    }
    if (msg.chosenIdx === null) {
      feedbackEl.textContent = isMe ? 'Czas minal!' : `${responder ? responder.name : 'Gracz'}: czas minal!`;
      feedbackEl.classList.add('bad');
    } else if (msg.correct) {
      feedbackEl.textContent = isMe ? 'Dobra odpowiedz!' : `${responder ? responder.name : 'Gracz'}: dobra odpowiedz!`;
      feedbackEl.classList.add('good');
    } else {
      feedbackEl.textContent = isMe ? 'Zla odpowiedz!' : `${responder ? responder.name : 'Gracz'}: zla odpowiedz!`;
      feedbackEl.classList.add('bad');
    }
    renderScoresTable();
  }

  function renderScoresTable() {
    scoresBar.innerHTML = state.players
      .map((p) => {
        const stats = state.liveStats[p.id] || { correct: 0, wrong: 0 };
        return `<tr class="${p.id === state.currentPlayerId ? 'current' : ''}"><td>${escapeHtml(p.name)}${p.id === state.myId ? ' (Ty)' : ''}</td><td>${stats.correct}</td><td>${stats.wrong}</td></tr>`;
      })
      .join('');
  }

  function renderEnd() {
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    const topScore = sorted[0] ? sorted[0].score : 0;
    if (sorted.length) window.recordGameResult(sorted.map((p) => ({ name: p.name, score: p.score })));
    finalScoresEl.innerHTML = sorted
      .map((p) => {
        const entries = state.history.filter((h) => h.player === p.name);
        const correct = entries.filter((h) => h.isCorrect).length;
        const wrong = entries.length - correct;
        return `<div class="final-score-row${p.score === topScore ? ' winner' : ''}">
          <span>${escapeHtml(p.name)}${p.id === state.myId ? ' (Ty)' : ''}</span>
          <span class="score-detail">
            <span class="pts">${p.score} pkt</span>
            <span class="ok-count">${correct} ✓</span>
            <span class="bad-count">${wrong} ✗</span>
          </span>
        </div>`;
      })
      .join('');

    historyBody.innerHTML = state.history
      .map((r, i) => `<tr class="${r.isCorrect ? 'row-good' : 'row-bad'}">
        <td>${i + 1}</td>
        <td>${escapeHtml(r.player)}</td>
        <td>${escapeHtml(r.question)}</td>
        <td>${escapeHtml(r.chosen || '(brak - czas minal)')}</td>
        <td>${r.isCorrect ? '✓' : '✗'}</td>
      </tr>`)
      .join('');

    showScreen('screen-online-end');
  }
})();
