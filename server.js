const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { QUESTIONS, shuffleOptions } = require('./public/questions.js');

const PORT = process.env.PORT || 3002;
const PUBLIC_DIR = path.join(__dirname, 'public');
const ANSWER_TIME_MS = 5000;
const MAX_PLAYERS = 4;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/manifest+json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(PUBLIC_DIR, filePath.split('?')[0]);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
});

// --- Tryb online (pokoje z krotkim kodem) - tylko ten serwer je obsluguje. ---
// Tryb lokalny (jeden telefon) dziala w calosci po stronie klienta, bez serwera.
const wss = new WebSocketServer({ server });
const rooms = new Map();

function makeRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (rooms.has(code));
  return code;
}

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

function buildDeck(category, difficulty) {
  const pool = collectQuestions(category, difficulty);
  const shuffled = shuffle(pool).map(shuffleOptions);
  const a = [];
  const b = [];
  shuffled.forEach((q, i) => (i % 2 === 0 ? a : b).push(q));
  return { a, b };
}

function send(ws, msg) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg) {
  room.players.forEach((p) => send(p.ws, msg));
}

function publicPlayers(room) {
  return room.players.map((p) => ({ id: p.id, name: p.name, score: p.score }));
}

function roomStatePayload(room) {
  return {
    code: room.code,
    players: publicPlayers(room),
    currentPlayerId: room.players[room.currentIndex] ? room.players[room.currentIndex].id : null,
    pileCounts: { a: room.piles.a.length, b: room.piles.b.length },
    started: room.started,
    hostId: room.players[0] ? room.players[0].id : null,
  };
}

function resolveAnswer(room, idx) {
  if (room.answered || !room.activeQuestion) return;
  room.answered = true;
  clearTimeout(room.timerHandle);

  const q = room.activeQuestion;
  const correct = typeof idx === 'number' && idx === q.correct;
  const current = room.players[room.currentIndex];
  if (current) {
    if (correct) current.score += 1;
    current.history.push({
      question: q.q,
      chosen: typeof idx === 'number' ? q.options[idx] : null,
      isCorrect: correct,
    });
  }

  broadcast(room, {
    type: 'answer_result',
    playerId: current ? current.id : null,
    chosenIdx: typeof idx === 'number' ? idx : null,
    correctIdx: q.correct,
    correct,
    players: publicPlayers(room),
  });

  room.activeQuestion = null;

  room.nextTurnHandle = setTimeout(() => {
    if (!rooms.has(room.code)) return;
    if (room.piles.a.length === 0 && room.piles.b.length === 0) {
      endGame(room);
      return;
    }
    if (room.players.length === 0) return;
    room.currentIndex = (room.currentIndex + 1) % room.players.length;
    broadcast(room, { type: 'turn_change', state: roomStatePayload(room) });
  }, 1400);
}

function endGame(room) {
  room.ended = true;
  const history = [];
  room.players.forEach((p) => p.history.forEach((h) => history.push({ player: p.name, ...h })));
  broadcast(room, { type: 'game_over', players: publicPlayers(room), history });
}

wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).slice(2, 10);
  ws.roomCode = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    if (msg.type === 'create') {
      const code = makeRoomCode();
      const room = {
        code,
        players: [],
        category: msg.category || 'polska',
        difficulty: msg.difficulty || 'latwy',
        piles: { a: [], b: [] },
        currentIndex: 0,
        activeQuestion: null,
        answered: false,
        timerHandle: null,
        nextTurnHandle: null,
        started: false,
        ended: false,
      };
      const name = (msg.name || '').trim().slice(0, 20) || 'Gracz 1';
      room.players.push({ id: ws.id, ws, name, score: 0, history: [] });
      ws.roomCode = code;
      rooms.set(code, room);
      send(ws, { type: 'created', playerId: ws.id, state: roomStatePayload(room) });
      return;
    }

    if (msg.type === 'join') {
      const room = rooms.get((msg.code || '').toUpperCase());
      if (!room) {
        send(ws, { type: 'error', message: 'Nieprawidlowy kod pokoju.' });
        return;
      }
      if (room.started) {
        send(ws, { type: 'error', message: 'Gra w tym pokoju juz sie rozpoczela.' });
        return;
      }
      if (room.players.length >= MAX_PLAYERS) {
        send(ws, { type: 'error', message: 'Pokoj jest pelny (max 4 graczy).' });
        return;
      }
      const name = (msg.name || '').trim().slice(0, 20) || `Gracz ${room.players.length + 1}`;
      room.players.push({ id: ws.id, ws, name, score: 0, history: [] });
      ws.roomCode = room.code;
      send(ws, { type: 'joined', playerId: ws.id, state: roomStatePayload(room) });
      broadcast(room, { type: 'room_update', state: roomStatePayload(room) });
      return;
    }

    const room = rooms.get(ws.roomCode);
    if (!room) return;

    if (msg.type === 'start') {
      if (room.started) return;
      if (room.players.length < 2) {
        send(ws, { type: 'error', message: 'Potrzeba co najmniej 2 graczy.' });
        return;
      }
      if (!room.players[0] || room.players[0].id !== ws.id) return;
      room.started = true;
      room.piles = buildDeck(room.category, room.difficulty);
      room.currentIndex = 0;
      broadcast(room, { type: 'game_start', state: roomStatePayload(room) });
      return;
    }

    if (msg.type === 'draw') {
      if (!room.started || room.ended || room.activeQuestion) return;
      const current = room.players[room.currentIndex];
      if (!current || current.id !== ws.id) return;
      const pileKey = msg.pile === 'b' ? 'b' : 'a';
      if (room.piles[pileKey].length === 0) return;

      const q = room.piles[pileKey].pop();
      room.activeQuestion = q;
      room.answered = false;
      const deadline = Date.now() + ANSWER_TIME_MS;
      broadcast(room, {
        type: 'question',
        question: { q: q.q, options: q.options },
        pileCounts: { a: room.piles.a.length, b: room.piles.b.length },
        deadline,
        currentPlayerId: current.id,
      });
      clearTimeout(room.timerHandle);
      room.timerHandle = setTimeout(() => resolveAnswer(room, null), ANSWER_TIME_MS + 300);
      return;
    }

    if (msg.type === 'answer') {
      if (!room.started || room.ended || !room.activeQuestion || room.answered) return;
      const current = room.players[room.currentIndex];
      if (!current || current.id !== ws.id) return;
      resolveAnswer(room, typeof msg.idx === 'number' ? msg.idx : null);
      return;
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;

    const leavingIndex = room.players.findIndex((p) => p.id === ws.id);
    if (leavingIndex === -1) return;
    const wasCurrentTurn = room.started && !room.ended && leavingIndex === room.currentIndex && room.activeQuestion;

    room.players.splice(leavingIndex, 1);

    if (room.players.length === 0) {
      clearTimeout(room.timerHandle);
      clearTimeout(room.nextTurnHandle);
      rooms.delete(room.code);
      return;
    }

    if (leavingIndex < room.currentIndex) room.currentIndex -= 1;
    if (room.currentIndex >= room.players.length) room.currentIndex = 0;

    if (wasCurrentTurn) {
      clearTimeout(room.timerHandle);
      room.activeQuestion = null;
      room.answered = false;
    }

    if (room.started && !room.ended && room.players.length < 2) {
      endGame(room);
      return;
    }

    broadcast(room, { type: 'opponent_left', state: roomStatePayload(room) });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} jest juz zajety - prawdopodobnie inny serwer juz dziala.`);
    console.error(`Otworz http://localhost:${PORT} w przegladarce zamiast uruchamiac serwer ponownie.`);
  } else {
    console.error('Blad serwera:', err.message);
  }
  console.error('Nacisnij Ctrl+C aby zamknac to okno.');
});

server.listen(PORT, () => {
  console.log(`Serwer gry karcianej dziala na porcie ${PORT}`);
  console.log(`Otworz w przegladarce: http://localhost:${PORT}`);
});
