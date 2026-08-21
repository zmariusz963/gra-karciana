// Wspolne przelaczanie ekranow, uzywane przez game.js (tryb lokalny) i online.js (tryb online).
(function () {
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }
  window.showScreen = showScreen;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-back-to]');
    if (!btn) return;
    showScreen(btn.dataset.backTo);
  });

  document.getElementById('mode-local-btn').addEventListener('click', () => showScreen('screen-setup'));
  document.getElementById('mode-online-btn').addEventListener('click', () => showScreen('screen-online-menu'));
})();
