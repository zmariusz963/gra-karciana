// Wspolne przelaczanie ekranow, uzywane przez game.js (tryb lokalny) i online.js (tryb online).
(function () {
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }
  window.showScreen = showScreen;

  // Nazwy kategorii do wyswietlania (np. na etykietach talii).
  window.CATEGORY_LABELS = {
    polska: 'Polska',
    swiat: 'Swiat',
    europa: 'Europa',
    azja: 'Azja',
    ameryka_polnocna: 'Ameryka Pn.',
    ameryka_poludniowa: 'Ameryka Pd.',
    afryka: 'Afryka',
    australia: 'Australia',
    podroze: 'Podroze',
    sport: 'Sport',
    wiedza_ogolna: 'Wiedza ogolna',
    mix: 'Mix',
    losowa: 'Losowo',
  };

  // Sygnal dzwiekowy + wibracja, gdy zostaje ostatnia sekunda na odpowiedz.
  function beepAndVibrate() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // Web Audio niedostepne - pomijamy dzwiek, zostaje sama wibracja.
    }
    if (navigator.vibrate) navigator.vibrate(200);
  }
  window.beepAndVibrate = beepAndVibrate;

  // Efekt rozlatujacych sie emotek - wybuch przy blednej odpowiedzi, ptaszki przy poprawnej.
  function spawnParticles(element, symbols, count) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'explosion-particle';
      particle.textContent = symbols[i % symbols.length];
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const dist = 50 + Math.random() * 50;
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      particle.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 650);
    }
  }
  function explodeAt(element) {
    spawnParticles(element, ['💣', '💥', '🔥', '💢'], 12);
  }
  function celebrateAt(element) {
    spawnParticles(element, ['✅', '🎉'], 10);
  }
  window.explodeAt = explodeAt;
  window.celebrateAt = celebrateAt;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-back-to]');
    if (!btn) return;
    showScreen(btn.dataset.backTo);
  });

  document.getElementById('mode-local-btn').addEventListener('click', () => showScreen('screen-setup'));
  document.getElementById('mode-online-btn').addEventListener('click', () => showScreen('screen-online-menu'));

  // Ranking zwyciestw i punktow - trwaly, zapisywany lokalnie na tym urzadzeniu/przegladarce.
  const STATS_KEY = 'gra-karciana-stats';

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function loadStats() {
    try {
      return JSON.parse(localStorage.getItem(STATS_KEY)) || {};
    } catch {
      return {};
    }
  }

  function renderWinsTable() {
    const stats = loadStats();
    const entries = Object.entries(stats)
      .sort((a, b) => (b[1].points || 0) - (a[1].points || 0))
      .slice(0, 8);
    const html = entries.length
      ? entries.map(([name, s]) => `<tr><td>${escapeHtml(name)}</td><td>${s.wins || 0}</td><td>${s.losses || 0}</td><td>${s.points || 0}</td></tr>`).join('')
      : '<tr class="empty-row"><td colspan="4">Brak wynikow</td></tr>';
    document.querySelectorAll('.wins-table-body').forEach((body) => {
      body.innerHTML = html;
    });
  }

  // players: [{name, score}] - wszyscy gracze z zakonczonej gry (nie tylko zwyciezcy).
  function recordGameResult(players) {
    if (!players || !players.length) return;
    const stats = loadStats();
    const topScore = Math.max(...players.map((p) => p.score));
    players.forEach((p) => {
      const entry = stats[p.name] || { wins: 0, losses: 0, points: 0 };
      entry.points += p.score;
      if (topScore > 0) {
        if (p.score === topScore) entry.wins += 1;
        else entry.losses += 1;
      }
      stats[p.name] = entry;
    });
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    renderWinsTable();
  }

  window.recordGameResult = recordGameResult;
  window.renderWinsTable = renderWinsTable;
  renderWinsTable();
})();
