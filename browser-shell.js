/* Browser hybrid shell: persistence, startup, touch controls, and installability. */
(() => {
  const api = window.__handFromTheDeep;
  const startButton = document.getElementById('start-game');
  const saveButton = document.getElementById('save-game');
  const loadButton = document.getElementById('load-game');
  const status = document.getElementById('save-status');
  const key = 'hand-from-the-deep.continuity.v2';

  document.body.classList.toggle('embed-mode', new URLSearchParams(location.search).get('embed') === '1');
  if (!api) return;
  const getGame = () => api.game;
  const setStatus = (message) => { if (status) status.textContent = message; };
  const focusGame = () => document.getElementById('game')?.focus();
  const start = () => { api.startGame(); if (startButton) startButton.hidden = true; focusGame(); };

  startButton?.addEventListener('click', start);
  addEventListener('keydown', (event) => { if (event.key === 'Enter' && getGame().mode === 'title') start(); });

  const activeButtons = new Map();
  const release = (button) => { const keyName = activeButtons.get(button); if (!keyName) return; activeButtons.delete(button); window.dispatchEvent(new KeyboardEvent('keyup', { key: keyName, bubbles: true })); button.classList.remove('active'); };
  document.querySelectorAll('[data-key]').forEach((button) => {
    const keyName = button.dataset.key;
    button.addEventListener('pointerdown', (event) => { event.preventDefault(); if (activeButtons.has(button)) return; activeButtons.set(button, keyName); button.setPointerCapture?.(event.pointerId); window.dispatchEvent(new KeyboardEvent('keydown', { key: keyName, bubbles: true })); button.classList.add('active'); });
    button.addEventListener('pointerup', (event) => { event.preventDefault(); release(button); });
    button.addEventListener('pointercancel', () => release(button));
    button.addEventListener('lostpointercapture', () => release(button));
  });
  addEventListener('blur', () => activeButtons.forEach((_, button) => release(button)));

  const continuity = () => {
    const g = getGame();
    return { savedAt: new Date().toISOString(), version: 2, mode: g.mode, room: g.room, statuses: { ...g.statuses }, flags: { ...g.flags }, unlockedRooms: [...g.unlockedRooms], awards: { unlocked: [...g.awards.unlocked] }, player: { x: g.player.x, y: g.player.y } };
  };
  const save = (quiet = false) => { try { localStorage.setItem(key, JSON.stringify(continuity())); if (!quiet) setStatus(`Continuity preserved ${new Date().toLocaleTimeString()}`); } catch { setStatus('Continuity storage unavailable'); } };
  const restore = () => {
    try {
      const raw = localStorage.getItem(key); if (!raw) { setStatus('No continuity found'); return; }
      const saved = JSON.parse(raw); const g = getGame();
      g.mode = saved.mode === 'title' ? 'playing' : (saved.mode || 'playing');
      g.room = api.ROOMS[saved.room] ? saved.room : 'cradle';
      g.statuses = { ...g.statuses, ...(saved.statuses || {}) };
      g.flags = { ...g.flags, ...(saved.flags || {}) };
      g.unlockedRooms = Array.isArray(saved.unlockedRooms) ? saved.unlockedRooms.filter((room) => api.ROOMS[room]) : ['cradle'];
      if (!g.unlockedRooms.includes('cradle')) g.unlockedRooms.unshift('cradle');
      g.awards.unlocked = Array.isArray(saved.awards?.unlocked) ? saved.awards.unlocked.filter((award) => api.AWARDS[award]) : [];
      if (saved.player) { g.player.x = Number.isFinite(Number(saved.player.x)) ? Number(saved.player.x) : g.player.x; g.player.y = Number.isFinite(Number(saved.player.y)) ? Number(saved.player.y) : g.player.y; }
      if (startButton) startButton.hidden = true;
      g.message = 'CONTINUITY RESTORED.'; g.hint = 'The station remembers your route through the maze.';
      setStatus(`Restored ${saved.savedAt ? new Date(saved.savedAt).toLocaleTimeString() : 'saved state'}`); focusGame();
    } catch { setStatus('Continuity data is corrupted'); }
  };
  saveButton?.addEventListener('click', () => save());
  loadButton?.addEventListener('click', restore);
  addEventListener('beforeunload', () => save(true));
  setInterval(() => { if (getGame().mode === 'playing') save(true); }, 10000);
  try { if (localStorage.getItem(key)) setStatus('Continuity available'); } catch { setStatus('Local saves unavailable'); }
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => setStatus('Offline shell unavailable'));
})();
