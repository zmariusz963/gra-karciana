// Wspolne przelaczanie ekranow, uzywane przez game.js (tryb lokalny) i online.js (tryb online).
(function () {
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }
  window.showScreen = showScreen;

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

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-back-to]');
    if (!btn) return;
    showScreen(btn.dataset.backTo);
  });

  document.getElementById('mode-local-btn').addEventListener('click', () => showScreen('screen-setup'));
  document.getElementById('mode-online-btn').addEventListener('click', () => showScreen('screen-online-menu'));
})();
