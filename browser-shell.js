/* Browser hybrid shell: persistence and installability around the canvas slice. */
(() => {
  const api = window.__handFromTheDeep;
  const saveButton = document.getElementById('save-game');
  const loadButton = document.getElementById('load-game');
  const status = document.getElementById('save-status');
  const key = 'hand-from-the-deep.continuity.v1';

  if (!api || !saveButton || !loadButton) return;

  const setStatus = (message) => { status.textContent = message; };

  const continuity = () => {
    const g = api.game;
    return {
      savedAt: new Date().toISOString(),
      scene: g.scene,
      mode: g.mode,
      statuses: { ...g.statuses },
      flags: { ...g.flags },
      player: { x: g.player.x, y: g.player.y },
      choice: g.choice || null
    };
  };

  const save = (quiet = false) => {
    localStorage.setItem(key, JSON.stringify(continuity()));
    if (!quiet) setStatus(`Continuity preserved ${new Date().toLocaleTimeString()}`);
  };

  const restore = () => {
    const raw = localStorage.getItem(key);
    if (!raw) { setStatus('No continuity found'); return; }
    try {
      const saved = JSON.parse(raw);
      const g = api.game;
      g.mode = saved.mode || 'playing';
      g.scene = saved.scene || 'awakening';
      g.statuses = { ...g.statuses, ...(saved.statuses || {}) };
      g.flags = { ...g.flags, ...(saved.flags || {}) };
      g.choice = saved.choice || null;
      if (saved.player) { g.player.x = saved.player.x; g.player.y = saved.player.y; }
      g.message = 'CONTINUITY RESTORED.';
      g.hint = 'The V.R.P. remembers what you chose.';
      setStatus(`Restored ${new Date(saved.savedAt).toLocaleTimeString()}`);
    } catch { setStatus('Continuity data is corrupted'); }
  };

  saveButton.addEventListener('click', () => save());
  loadButton.addEventListener('click', restore);
  addEventListener('beforeunload', () => save(true));
  setInterval(() => {
    if (api.game.mode === 'playing') save(true);
  }, 10000);
  if (localStorage.getItem(key)) setStatus('Continuity available');

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => setStatus('Offline shell unavailable'));
  }
})();
