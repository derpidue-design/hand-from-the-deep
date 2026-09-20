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

  const activeButtons = new Map();
  const releaseButton = (button) => {
    const keyName = activeButtons.get(button);
    if (!keyName) return;
    activeButtons.delete(button);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: keyName, bubbles: true }));
    button.classList.remove('active');
  };
  document.querySelectorAll('[data-key]').forEach((button) => {
    const keyName = button.dataset.key;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (activeButtons.has(button)) return;
      activeButtons.set(button, keyName);
      button.setPointerCapture?.(event.pointerId);
      window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, bubbles: true }));
      button.classList.add('active');
    });
    button.addEventListener('pointerup', (event) => { event.preventDefault(); releaseButton(button); });
    button.addEventListener('pointercancel', () => releaseButton(button));
    button.addEventListener('lostpointercapture', () => releaseButton(button));
  });
  addEventListener('blur', () => activeButtons.forEach((_, button) => releaseButton(button)));

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
    try {
      const raw = localStorage.getItem(key);
      if (!raw) { setStatus('No continuity found'); return; }
      const saved = JSON.parse(raw);
      const g = getGame();
      g.mode = saved.mode || 'playing';
      g.scene = saved.scene || 'awakening';
      g.statuses = { ...g.statuses, ...(saved.statuses || {}) };
      g.flags = { ...g.flags, ...(saved.flags || {}) };
      if (saved.player) { g.player.x = Number.isFinite(Number(saved.player.x)) ? Number(saved.player.x) : g.player.x; g.player.y = Number.isFinite(Number(saved.player.y)) ? Number(saved.player.y) : g.player.y; }
      if (g.mode !== 'title' && startButton) startButton.hidden = true;
      g.message = 'CONTINUITY RESTORED.';
      g.hint = 'The V.R.P. remembers what you chose.';
      setStatus(`Restored ${saved.savedAt ? new Date(saved.savedAt).toLocaleTimeString() : 'saved state'}`);
      focusGame();
    } catch { setStatus('Continuity data is corrupted'); }
  };
  saveButton?.addEventListener('click', () => save());
  loadButton?.addEventListener('click', restore);
  addEventListener('beforeunload', () => save(true));
  setInterval(() => { if (getGame().mode === 'playing') save(true); }, 10000);
  try { if (localStorage.getItem(key)) setStatus('Continuity available'); } catch { setStatus('Local saves unavailable'); }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => setStatus('Offline shell unavailable'));
})();
