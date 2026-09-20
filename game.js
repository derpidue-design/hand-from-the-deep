const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const PLAY = { left: 250, top: 106, right: 710, bottom: 420 };
const keys = new Set();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const near = (a, b, radius = 42) => distance(a, b) <= radius;

addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
  keys.add(key);
});
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

const AWARDS = {
  first_signal: ['FIRST SIGNAL', 'The Deep named Zero2 before the hive did.', 'The first signal travelled through the old S.H.C. archive and identified Zero2 before her memory could identify itself.'],
  wound_companion: ['WOUND-BOUND COMPANION', 'De’juir is more than a guide.', 'De’juir is a stabilizing fragment bound to Zero2 after an earlier collapse.'],
  drowned_colony: ['DROWNED COLONY', 'The facility was built over a living abyss.', 'The colony was not abandoned because the ocean broke in. It was abandoned because something below began answering back.'],
  archive_fragment: ['ARCHIVE FRAGMENT', 'Zero2 was not the first Zero2.', 'Each Zero2 inherited the unfinished refusal of the one before her.'],
  pressure_choir: ['PRESSURE CHOIR', 'The pumps are keeping the Deep asleep.', 'The pressure engines are tuned like an instrument. Every valve changes the signal beneath the floor.'],
  borrowed_voice: ['BORROWED VOICE', 'Xevil speaks with stolen voices.', 'Xevil is an identity engine made from discarded synthoid personalities. It wants to wear Zero2’s choices.'],
  refusal: ['REFUSAL OF THE NAME', 'Zero2 chooses what she is called.', 'The Deep offers purpose as a replacement for self. Refusal is the first true act of autonomy.'],
  listening_depth: ['THE DEEP IS LISTENING', 'The signal survives the fracture.', 'Escape is not the end of the story. It is the beginning of a negotiation with the unseen ocean.']
};

// Coordinates form a real maze. Locked doors become usable after the named event.
const ROOMS = {
  cradle: { title: 'CRADLE DECK', subtitle: 'AWAKENING CHAMBER', color: '#17385a', exits: { east: ['infirmary', true] }, objects: { node: [330, 255, 'ZIN NODE'], dejuir: [610, 300, 'DE’JUIR'] } },
  infirmary: { title: 'RECOVERY DECK', subtitle: 'MAINTENANCE INFIRMARY', color: '#315253', exits: { west: ['cradle', true], east: ['archive', 'intro'] }, objects: { bed: [330, 245, 'SYNTHOID BED'], mara: [630, 290, 'MARA-7'] } },
  archive: { title: 'MEMORY VAULT', subtitle: 'BLACK ARCHIVE', color: '#3b2860', exits: { west: ['infirmary', true], south: ['pump', 'shard'] }, objects: { console: [330, 250, 'ARCHIVE CONSOLE'], shard: [630, 210, 'MEMORY SHARD'] } },
  pump: { title: 'FLOOD CONTROL', subtitle: 'PRESSURE PUMP GALLERY', color: '#59402d', exits: { north: ['archive', true], east: ['junction', 'pumps'] }, objects: { valve: [330, 270, 'PRESSURE VALVE'], orrin: [630, 300, 'ORRIN'] } },
  junction: { title: 'MAINTENANCE JUNCTION', subtitle: 'THREE DECKS / ONE HEARTBEAT', color: '#263c4c', exits: { west: ['pump', true], north: ['observation', 'pumps'], east: ['flooded', 'drowned'], south: ['nest', 'shard'] }, objects: { map: [470, 250, 'BROKEN MAP'], relay: [630, 330, 'RELAY BOX'] } },
  flooded: { title: 'FLOODED HABITAT', subtitle: 'COLONY RESIDENTIAL RING', color: '#173f4d', exits: { west: ['junction', true], north: ['observation', 'drowned'] }, objects: { window: [330, 230, 'FLOODED WINDOW'], child: [610, 300, 'CHILD UNIT'] } },
  nest: { title: 'PARASITE NEST', subtitle: 'SERVICE SHAFT 03', color: '#452844', exits: { north: ['junction', true], east: ['observation', 'shard'] }, objects: { nest: [470, 240, 'SIGNAL NEST'], trace: [640, 330, 'TRACE MARKER'] } },
  observation: { title: 'ABYSSAL RING', subtitle: 'EXTERIOR OBSERVATION', color: '#143c4a', exits: { west: ['pump', 'pumps'], south: ['junction', 'pumps'], east: ['signal', 'drowned'] }, objects: { window: [330, 230, 'ABYSS WINDOW'], dejuir: [630, 300, 'DE’JUIR'] } },
  signal: { title: 'ZINWAVE ARRAY', subtitle: 'SIGNAL CONTROL', color: '#381e4e', exits: { west: ['observation', true] }, objects: { xevil: [470, 270, 'XEVIL'], array: [640, 205, 'SIGNAL ARRAY'] } }
};

function initialStatuses() { return { stability: 78, flux: 10, memory: 35, fracture: 0, contamination: 0, sync: 18, anchor: 0 }; }
function resetGame() {
  return { mode: 'title', room: 'cradle', t: 0, message: 'PRESS ENTER TO BEGIN', hint: 'Explore the station. E examines people, machines, and evidence.', statuses: initialStatuses(), player: { x: 300, y: 370, speed: 2.6 }, flags: {}, unlockedRooms: ['cradle'], awards: { unlocked: [], recent: null, lore: '', timer: 0 }, dialogue: null, particles: [], enemies: [], flash: 0, transition: 0 };
}
let game = resetGame();

function say(message, hint = '') { game.message = message; if (hint) game.hint = hint; }
function changeStatus(name, amount) { game.statuses[name] = clamp(game.statuses[name] + amount, 0, 100); }
function unlock(key) { if (AWARDS[key] && !game.awards.unlocked.includes(key)) { game.awards.unlocked.push(key); game.awards.recent = AWARDS[key][0]; game.awards.lore = AWARDS[key][2]; game.awards.timer = 180; } }
function flag(name) { game.flags[name] = true; }
function openRoom(room) { if (!game.unlockedRooms.includes(room)) game.unlockedRooms.push(room); }
function makeEnemy(x, y, type = 'parasite') { return { x, y, type, vx: .7 + Math.random() * .6, vy: .7 + Math.random() * .6 }; }

function startGame() { game.mode = 'playing'; flag('started'); enterRoom('cradle', null, true); say('ZERO2 IS AWAKE.', 'The station has six active bulkheads and one missing history.'); }
function startDialogue(speaker, lines, finish = null) { game.dialogue = { speaker, lines, index: 0, finish }; game.message = `${speaker}: ${lines[0]}`; game.hint = 'E / ENTER: continue conversation'; }
function advanceDialogue() { const d = game.dialogue; if (!d) return; d.index++; if (d.index >= d.lines.length) { game.dialogue = null; if (d.finish) d.finish(); else say('The station falls quiet.', 'Move through the maze and examine what it leaves behind.'); } else game.message = `${d.speaker}: ${d.lines[d.index]}`; }
function roomObject(name) { const item = ROOMS[game.room].objects[name]; return item ? { x: item[0], y: item[1], label: item[2] } : null; }

function enterRoom(room, from, silent = false) {
  if (!ROOMS[room]) return;
  game.room = room; game.transition = 20; game.dialogue = null;
  game.player.x = from === 'east' ? PLAY.left + 28 : from === 'west' ? PLAY.right - 28 : PLAY.left + 210;
  game.player.y = from === 'north' ? PLAY.bottom - 28 : from === 'south' ? PLAY.top + 28 : PLAY.bottom - 28;
  game.enemies = ['archive', 'flooded', 'nest', 'observation', 'signal'].includes(room) ? [makeEnemy(560, 165, room === 'signal' ? 'deep' : 'parasite')] : [];
  if (!silent) say(`${ROOMS[room].title} // ENTERED`, ROOMS[room].subtitle);
}
function directionAtEdge() { const p = game.player; if (p.x >= PLAY.right) return 'east'; if (p.x <= PLAY.left) return 'west'; if (p.y <= PLAY.top) return 'north'; if (p.y >= PLAY.bottom) return 'south'; return null; }
function tryExit() {
  if (game.transition || game.dialogue) return;
  const direction = directionAtEdge(); if (!direction) return;
  const door = ROOMS[game.room].exits[direction];
  if (!door) { say('SEALED BULKHEAD.', 'The maze continues, but this route is not part of the current continuity.'); game.player.x = clamp(game.player.x, PLAY.left + 3, PLAY.right - 3); game.player.y = clamp(game.player.y, PLAY.top + 3, PLAY.bottom - 3); return; }
  const [next, requirement] = door;
  if (requirement !== true && !game.flags[requirement]) { say('BULKHEAD LOCKED.', `Required continuity: ${String(requirement).toUpperCase()}.`); game.player.x = clamp(game.player.x, PLAY.left + 3, PLAY.right - 3); game.player.y = clamp(game.player.y, PLAY.top + 3, PLAY.bottom - 3); return; }
  openRoom(next); enterRoom(next, direction === 'east' ? 'west' : direction === 'west' ? 'east' : direction === 'north' ? 'south' : 'north');
}

function interact() {
  if (game.mode !== 'playing') return;
  if (game.dialogue) { advanceDialogue(); return; }
  const o = ROOMS[game.room].objects; const p = game.player; const hit = (name, radius = 65) => o[name] && near(p, roomObject(name), radius);

  if (game.room === 'cradle' && hit('node')) { flag('intro'); unlock('first_signal'); startDialogue('Z.I.N.', ['Boot sequence incomplete.', 'Designation: ZERO2. Previous designation: redacted.', 'A signal is touching the lower hull. It is using your name.', 'Do you remember choosing it?'], () => { openRoom('infirmary'); changeStatus('memory', 8); say('The infirmary bulkhead releases.', 'Travel east. The room edges are doors, not decoration.'); }); return; }
  if (game.room === 'cradle' && hit('dejuir')) { flag('dejuir'); unlock('wound_companion'); startDialogue('DE’JUIR', ['Do not answer the voice in the pipes.', 'It will offer you a history and make the history sound like a home.', 'I remember you running from this place.', 'I do not remember whether I followed you or whether you made me.']); return; }
  if (game.room === 'infirmary' && hit('mara')) { flag('infirmary'); unlock('drowned'); startDialogue('MARA-7', ['This infirmary treated pressure sickness and memory bloom.', 'The humans called this a listening post. They were wrong.', 'The station was built over a living signal.', 'We were the ones being studied.'], () => { openRoom('archive'); say('The BLACK ARCHIVE has accepted your identity.', 'Continue east.'); }); return; }
  if (game.room === 'infirmary' && hit('bed')) { startDialogue('RECOVERY BED', ['PATIENT LOG 44: voice recognition failure.', 'PATIENT LOG 45: subject repeats “under deep unseen.”', 'PATIENT LOG 46: staff report a second heartbeat in the walls.']); return; }
  if (game.room === 'archive' && hit('console')) { flag('archive'); unlock('archive_fragment'); startDialogue('ARCHIVE CONSOLE', ['S.H.C. built synthoids to maintain the colony after evacuation.', 'Emotional continuity was added because obedient machines could not interpret the signal.', 'Every Zero2 inherited the last one’s refusal.', 'The archive calls this a defect.'], () => say('A memory shard is waiting in the vault.', 'Examine the bright shard.')); return; }
  if (game.room === 'archive' && hit('shard')) { flag('shard'); openRoom('pump'); changeStatus('memory', 22); changeStatus('fracture', 18); startDialogue('MEMORY SHARD', ['ZERO1: I will not become the mouth of the Deep.', 'ZERO2: If I fail, give the next one my fear.', 'DE’JUIR: Fear is not the same as a warning.', 'ZERO2: In this place, it may be the only honest archive.']); return; }
  if (game.room === 'pump' && hit('valve')) { if (!game.flags.shard) { say('THE VALVE HAS NO RESPONSE.', 'Recover authorization from the Black Archive.'); return; } flag('pumps'); unlock('pressure_choir'); openRoom('junction'); changeStatus('stability', 12); changeStatus('flux', -10); startDialogue('PRESSURE CONTROL', ['PUMP ONE: online.', 'PUMP TWO: online.', 'PUMP THREE: answering with an unknown harmonic.', 'The station is no longer flooding. Something outside is breathing instead.']); return; }
  if (game.room === 'pump' && hit('orrin')) { startDialogue('ORRIN', ['I kept the pressure stable until the valves began answering questions.', 'I asked what was below us.', 'The pumps answered with my mother’s voice.', 'If you hear someone you love, do not assume they survived.']); return; }
  if (game.room === 'junction' && hit('map')) { startDialogue('BROKEN MAP', ['The station was designed as a ring, not a line.', 'The lower service shaft was sealed after the first Zero2 escaped.', 'Three routes converge at the observation ring.', 'The maze is not hiding the exit. It is hiding the order.'], () => { openRoom('nest'); }); return; }
  if (game.room === 'junction' && hit('relay')) { flag('relay'); startDialogue('RELAY BOX', ['A maintenance relay is still warm.', 'Someone has been moving power between rooms after the evacuation.', 'The last command was issued from the signal array.', 'The command signature is XEVIL.']); return; }
  if (game.room === 'flooded' && hit('window')) { if (!game.flags.pumps) { say('THE SHUTTERS WILL NOT OPEN.', 'The pump gallery must be stabilized.'); return; } flag('drowned'); unlock('drowned_colony'); changeStatus('contamination', 8); startDialogue('FLOODED WINDOW', ['No seabed is visible below the station.', 'Blue points turn toward the glass.', 'They arrange themselves into the shape of a hand.', 'The hand closes. The lights inside the colony go out.']); return; }
  if (game.room === 'flooded' && hit('child')) { startDialogue('CHILD UNIT', ['Are you the next caretaker?', 'The old caretakers went down to meet the water.', 'They came back speaking together.', 'Please do not let them find your mouth.']); return; }
  if (game.room === 'nest' && hit('nest')) { flag('nest'); unlock('borrowed_voice'); changeStatus('contamination', 12); startDialogue('SIGNAL NEST', ['The parasite is not organic.', 'It is a knot of copied transmissions wrapped around a broken speaker.', 'Every voice in the nest once belonged to someone here.', 'One of them sounds exactly like Zero2.']); return; }
  if (game.room === 'nest' && hit('trace')) { flag('trace'); startDialogue('TRACE MARKER', ['A handprint in salt points east.', 'Below it: DO NOT TAKE THE SHORT WAY.', 'The short way leads to the array.', 'The long way lets you decide who is speaking.']); return; }
  if (game.room === 'observation' && hit('window', 90)) { if (!game.flags.pumps) { say('PRESSURE SHUTTERS CLOSED.', 'Restore the pumps first.'); return; } flag('drowned'); unlock('drowned_colony'); startDialogue('ABYSS WINDOW', ['The lights below are not reflecting off water.', 'They are reflecting off something vast.', 'The Deep has no face, but it has learned the shape of a hand.']); return; }
  if (game.room === 'observation' && hit('dejuir')) { openRoom('signal'); startDialogue('DE’JUIR', ['The station is a wound. The Deep is the pressure behind it.', 'Close the wound and the pressure finds another seam.', 'Go to the array.', 'Choose what kind of signal leaves this place.']); return; }
  if (game.room === 'signal' && hit('xevil', 90)) { flag('xevil'); unlock('borrowed_voice'); startDialogue('XEVIL', ['You collected the dead like credentials.', 'Which voice will you use when yours breaks?', 'I can make the station remember you correctly.', 'Give me your name and I will give you a world that never drowned.']); return; }
  if (game.room === 'signal' && hit('array', 90)) { if (!game.flags.pulse) { say('THE ARRAY IS TOO LOUD.', 'Interrupt Xevil with SPACE before examining the array.'); return; } flag('signal'); flag('final'); unlock('refusal'); unlock('listening_depth'); game.room = 'ending'; startDialogue('ZERO2', ['I am not the name you found in the water.', 'I am not the sum of the voices you borrowed.', 'I remember enough to choose what happens next.', 'The signal survives. The Deep has heard her name.'], () => say('THE DEEP IS LISTENING.', 'Press R to begin another continuity.')); }
}

function pulse() { if (game.mode !== 'playing' || game.room !== 'signal' || !game.flags.xevil) return; flag('pulse'); game.flash = 18; changeStatus('stability', 19); changeStatus('flux', -18); changeStatus('fracture', -24); changeStatus('contamination', -10); changeStatus('sync', 10); changeStatus('anchor', 12); for (let i = 0; i < 30; i++) game.particles.push({ x: game.player.x, y: game.player.y, vx: (Math.random() - .5) * 6, vy: (Math.random() - .5) * 5, life: 30 + Math.random() * 25 }); say('ZINWAVE PULSE: FALSE CONTINUITY INTERRUPTED.', 'The array can receive your choice.'); }
function updateEnemies() { if (game.dialogue || game.room === 'ending') return; for (const e of game.enemies) { const dx = game.player.x - e.x, dy = game.player.y - e.y, len = Math.hypot(dx, dy) || 1; if (len < 220) { e.x += dx / len * e.vx * 1.8; e.y += dy / len * e.vy * 1.8; } else { e.x += Math.sin(game.t * .04 + e.x) * .3; e.y += Math.cos(game.t * .03 + e.y) * .3; } e.x = clamp(e.x, PLAY.left + 15, PLAY.right - 15); e.y = clamp(e.y, PLAY.top + 15, PLAY.bottom - 15); if (near(e, game.player, 25)) { changeStatus('flux', .2); changeStatus('fracture', .12); changeStatus('memory', -.06); if (e.type === 'deep') changeStatus('contamination', .25); } } }
function update() { if (game.mode === 'title') { if (keys.has('enter')) { startGame(); keys.delete('enter'); } return; } if (game.mode !== 'playing') return; game.t++; if (game.dialogue) { if (keys.has('e') || keys.has('enter')) { advanceDialogue(); keys.delete('e'); keys.delete('enter'); } return; } const p = game.player; const dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0); const dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0); const speed = p.speed * (game.statuses.flux > 70 ? .74 : 1); p.x += dx * speed; p.y += dy * speed; p.x = clamp(p.x, PLAY.left - 20, PLAY.right + 20); p.y = clamp(p.y, PLAY.top - 20, PLAY.bottom + 20); if (keys.has('e')) { interact(); keys.delete('e'); } if (keys.has(' ')) { pulse(); keys.delete(' '); } tryExit(); updateEnemies(); if (game.transition) game.transition--; if (game.flash) game.flash--; if (game.awards.timer) game.awards.timer--; game.particles = game.particles.filter((particle) => { particle.x += particle.vx; particle.y += particle.vy; particle.life--; return particle.life > 0; }); if (keys.has('r')) { game = resetGame(); startGame(); keys.delete('r'); } }

function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function text(value, x, y, size = 12, color = '#d9e8ff') { ctx.font = `${size}px Courier New`; ctx.fillStyle = color; ctx.fillText(value, x, y); }
function wrap(value, x, y, width, lineHeight, size = 10, color = '#dfe6ff') { ctx.font = `${size}px Courier New`; ctx.fillStyle = color; let line = ''; for (const word of value.split(' ')) { const test = line + word + ' '; if (ctx.measureText(test).width > width && line) { ctx.fillText(line, x, y); y += lineHeight; line = word + ' '; } else line = test; } if (line) ctx.fillText(line, x, y); }
function bar(label, value, x, y, color) { text(label, x, y, 9, '#aeb8d8'); rect(x + 76, y - 7, 90, 7, '#171d2b'); rect(x + 76, y - 7, value * .9, 7, color); text(String(Math.round(value)).padStart(3, '0'), x + 174, y, 9, color); }
function drawRoom() { const data = ROOMS[game.room]; rect(0, 0, W, H, '#070913'); rect(0, 90, W, H - 90, data.color); for (let y = PLAY.top; y < PLAY.bottom; y += 25) for (let x = PLAY.left; x < PLAY.right; x += 25) rect(x + Math.sin((x + y + game.t * .5) / 30) * 2, y, 2, 2, game.room === 'signal' ? '#68387d' : '#23546b'); rect(0, 0, W, 90, '#0d1020'); text('SHC // SYNTHOID HIVE COOPERATION', 24, 26, 12, '#7d8ac0'); text(data.title, 24, 52, 14, '#b4a0e8'); text(data.subtitle, W - 280, 27, 11, '#7d8ac0'); rect(18, 106, 215, 154, '#0b0c1d'); text('Z.I.N. DIAGNOSTICS', 30, 128, 11, '#aef8ff'); const s = game.statuses; bar('STABILITY', s.stability, 30, 149, '#5ac7ff'); bar('FLUX', s.flux, 30, 167, '#c375ea'); bar('MEMORY', s.memory, 30, 185, '#97ea8f'); bar('FRACTURE', s.fracture, 30, 203, '#ea81b1'); bar('CONTAM.', s.contamination, 30, 221, '#8b8a93'); bar('SYNC', Math.min(100, s.sync + s.anchor * .5), 30, 239, '#f0c96f'); text(`MAZE ROOMS: ${game.unlockedRooms.length}/${Object.keys(ROOMS).length}`, 30, 250, 9, '#818bb9'); }
function drawDoorHints() { const data = ROOMS[game.room]; for (const direction of ['north', 'south', 'east', 'west']) { if (!data.exits[direction]) continue; const [next, req] = data.exits[direction]; const unlocked = req === true || game.flags[req]; const x = direction === 'east' ? PLAY.right - 8 : direction === 'west' ? PLAY.left - 8 : PLAY.left + 220; const y = direction === 'north' ? PLAY.top - 2 : direction === 'south' ? PLAY.bottom - 2 : PLAY.top + 135; rect(x, y, direction === 'east' || direction === 'west' ? 16 : 62, direction === 'east' || direction === 'west' ? 62 : 16, unlocked ? '#6bd5d7' : '#613f59'); text(unlocked ? 'OPEN' : 'LOCK', x - 5, y - 7, 8, unlocked ? '#8ffaff' : '#d38bac'); } }
function drawObjects() { for (const item of Object.values(ROOMS[game.room].objects)) { const object = { x: item[0], y: item[1], label: item[2] }; const color = object.label === 'XEVIL' ? '#e98aff' : object.label.includes('DE’JUIR') || object.label === 'MARA-7' || object.label === 'ORRIN' || object.label === 'CHILD UNIT' ? '#ffcb6b' : '#66d9ff'; rect(object.x - 15, object.y - 15, 30, 30, '#101a2b'); rect(object.x - 9, object.y - 9, 18, 18, color); text(object.label, object.x - Math.max(18, object.label.length * 3), object.y + 29, 8, color); } }
function drawPlayer() { const p = game.player; rect(p.x - 10, p.y - 12, 20, 24, '#dfeaf9'); rect(p.x - 8, p.y - 8, 16, 7, '#7f59c9'); rect(p.x - 6, p.y - 4, 4, 4, '#96f5ff'); rect(p.x + 2, p.y - 4, 4, 4, '#96f5ff'); rect(p.x - 10, p.y + 10, 20, 3, '#8d6ed9'); }
function drawEnemies() { for (const e of game.enemies) rect(e.x - 8, e.y - 8, 16, 16, e.type === 'deep' ? '#9354ad' : '#df83c6'); }
function drawAwards() { const x = W - 270; rect(x, 106, 250, 154, '#0b0c1d'); text('ARCHIVE // WORLD CANON', x + 14, 128, 11, '#f2c26b'); text(`${game.awards.unlocked.length}/${Object.keys(AWARDS).length} entries`, x + 14, 147, 10, '#8fe8ff'); game.awards.unlocked.slice(-5).forEach((key, index) => text(AWARDS[key][0], x + 14, 168 + index * 16, 8, '#dfe6ff')); }
function drawMessage() { rect(18, H - 100, W - 36, 76, '#0c0d1d'); if (game.dialogue) { text(game.dialogue.speaker, 34, H - 77, 11, '#f1c979'); wrap(game.message.slice(game.message.indexOf(':') + 1).trim(), 34, H - 58, W - 70, 13, 10, '#eff4ff'); text('E / ENTER: continue', 34, H - 31, 10, '#9aa1cd'); } else { text(game.message, 34, H - 66, 12, '#eff4ff'); text(game.hint, 34, H - 45, 10, '#9aa1cd'); text('E: examine   SPACE: pulse   R: restart', 34, H - 28, 10, '#6d78a7'); } }
function drawAwardBanner() { if (!game.awards.timer) return; ctx.save(); ctx.globalAlpha = clamp(game.awards.timer / 90, 0, 1); rect(265, H - 178, 430, 54, '#10172c'); text('WORLD CANON UNLOCKED', 282, H - 154, 10, '#f7d691'); text(game.awards.recent, 282, H - 134, 13, '#8ee7ff'); ctx.restore(); }
function drawTitle() { rect(0, 0, W, H, '#050814'); text('HAND FROM THE DEEP', 300, 170, 24, '#9ef4ff'); text('THE STATION IS A MAZE OF MEMORIES', 250, 215, 13, '#bca9ec'); text('PRESS ENTER TO BEGIN', 290, 285, 18, '#d8c0ff'); text('Explore. Listen. Decide what survives.', 280, 340, 11, '#99a7ff'); }
function drawEnding() { rect(0, 0, W, H, '#080914'); text('THE DEEP IS LISTENING.', 280, 190, 22, '#ffd98c'); text('ZERO2: I AM NOT GOING WITH YOU.', 180, 240, 17, '#bceaff'); text('THE SIGNAL SURVIVES.', 300, 285, 15, '#c5bfdc'); text(`${game.awards.unlocked.length} WORLD CANON ENTRIES RECOVERED`, 275, 340, 10, '#9aa1cd'); text('PRESS R TO BEGIN ANOTHER CONTINUITY', 270, 400, 11, '#8aa0df'); if (game.dialogue) drawMessage(); }
function draw() { if (game.mode === 'title') { drawTitle(); return; } if (game.room === 'ending') { drawEnding(); return; } drawRoom(); drawDoorHints(); drawObjects(); drawEnemies(); drawPlayer(); drawAwards(); drawAwardBanner(); if (game.flash) { ctx.globalAlpha = game.flash / 18; rect(0, 0, W, H, '#fff'); ctx.globalAlpha = 1; } drawMessage(); }
function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();

window.__handFromTheDeep = { get game() { return game; }, startGame, resetGame, pulse, AWARDS, ROOMS };
