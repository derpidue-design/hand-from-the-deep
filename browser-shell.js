/* Browser hybrid shell: persistence, startup, touch controls, and installability. */
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

  // Touch buttons reuse the same keyboard input path as desktop controls.
  document.querySelectorAll('[data-key]').forEach((button) => {
    const keyName = button.dataset.key;
    const send = (type) => {
      window.dispatchEvent(new KeyboardEvent(type, { key: keyName, bubbles: true }));
      button.classList.toggle('active', type === 'keydown');
    };
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      send('keydown');
    });
    button.addEventListener('pointerup', (event) => {
      event.preventDefault();
      send('keyup');
    });
    button.addEventListener('pointercancel', () => send('keyup'));
    button.addEventListener('pointerleave', (event) => {
      if (event.buttons) send('keyup');
    });
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
  try { if (localStorage.getItem(key)) setStatus('Continuity available'); } catch { setStatus('Local saves unavailable'); }

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => setStatus('Offline shell unavailable'));
  }
})();
