/* Browser hybrid shell: persistence, startup, and installability around the canvas slice. */
(() => {
  const api = window.__handFromTheDeep;
  const startButton = document.getElementById('start-game');
  const saveButton = document.getElementById('save-game');
  const loadButton = document.getElementById('load-game');
  const status = document.getElementById('save-status');
  const key = 'hand-from-the-deep.continuity.v1';

  document.body.classList.toggle('embed-mode', new URLSearchParams(location.search).get('embed') === '1');
  if (!api) return;

  const getGame = () => api.game;
  const setStatus = (message) => { if (status) status.textContent = message; };
  const focusGame = () => document.getElementById('game')?.focus();
  const start = () => {
    api.startGame();
    if (startButton) startButton.hidden = true;
    focusGame();
  };

  if (startButton) startButton.addEventListener('click', start);
  addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && getGame().mode === 'title') start();
  });

  const continuity = () => {
    const g = getGame();
    return { savedAt: new Date().toISOString(), scene: g.scene, mode: g.mode, statuses: { ...g.statuses }, flags: { ...g.flags }, player: { x: g.player.x, y: g.player.y }, choice: g.choice || null };
  };

  const save = (quiet = false) => {
    try {
      localStorage.setItem(key, JSON.stringify(continuity()));
      if (!quiet) setStatus(`Continuity preserved ${new Date().toLocaleTimeString()}`);
    } catch { setStatus('Continuity storage unavailable'); }
  };

  const restore = () => {
    const raw = localStorage.getItem(key);
    if (!raw) { setStatus('No continuity found'); return; }
    try {
      const saved = JSON.parse(raw);
      const g = getGame();
      g.mode = saved.mode || 'playing';
      g.scene = saved.scene || 'awakening';
      g.statuses = { ...g.statuses, ...(saved.statuses || {}) };
      g.flags = { ...g.flags, ...(saved.flags || {}) };
      g.choice = saved.choice || null;
      if (saved.player) { g.player.x = Number(saved.player.x) || g.player.x; g.player.y = Number(saved.player.y) || g.player.y; }
      if (g.mode !== 'title' && startButton) startButton.hidden = true;
      g.message = 'CONTINUITY RESTORED.';
      g.hint = 'The V.R.P. remembers what you chose.';
      setStatus(`Restored ${saved.savedAt ? new Date(saved.savedAt).toLocaleTimeString() : 'saved state'}`);
      focusGame();
    } catch { setStatus('Continuity data is corrupted'); }
  };

  if (saveButton) saveButton.addEventListener('click', () => save());
  if (loadButton) loadButton.addEventListener('click', restore);
  addEventListener('beforeunload', () => save(true));
  setInterval(() => { if (getGame().mode === 'playing') save(true); }, 10000);
  if (localStorage.getItem(key)) setStatus('Continuity available');

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => setStatus('Offline shell unavailable'));
  }
})();
