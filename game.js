const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const ROOM_W = 960;
const ROOM_H = 540;

addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
  keys.add(key);
});
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const near = (a, b, radius = 42) => dist(a, b) < radius;

const AWARDS = {
  first_signal: ['FIRST SIGNAL', 'The Deep named Zero2 before the hive did.', 'The first signal travelled through the old S.H.C. archive and identified Zero2 before her memory could identify itself.'],
  wound_companion: ['WOUND-BOUND COMPANION', 'De’juir is more than a guide.', 'De’juir is a surviving emotional wound: a stabilizing fragment bound to Zero2 after an earlier collapse.'],
  archive_fragment: ['ARCHIVE FRAGMENT', 'Zero2 was not the first Zero2.', 'The recovery program has repeated for years. Each Zero2 inherited the unfinished refusal of the one before her.'],
  drowned_colony: ['DROWNED COLONY', 'The facility was built over a living abyss.', 'The research colony was not abandoned because the ocean broke in. It was abandoned because something below began answering back.'],
  borrowed_voice: ['BORROWED VOICE', 'Xevil speaks with stolen voices.', 'Xevil is an identity engine made from discarded synthoid personalities. It does not want to kill Zero2; it wants to wear her choices.'],
  pressure_choir: ['PRESSURE CHOIR', 'The pumps are keeping the Deep asleep.', 'The station’s pressure engines are tuned like an instrument. Every valve opened changes the signal heard beneath the floor.'],
  refusal_of_the_name: ['REFUSAL OF THE NAME', 'Zero2 chooses what she is called.', 'The Deep offers purpose as a replacement for self. Zero2’s refusal is the first true act of autonomy in the station.'],
  listening_depth: ['THE DEEP IS LISTENING', 'The signal survives the fracture.', 'The Deep has heard her name. Escape is no longer the end of the story; it is the beginning of a negotiation.']
};

const ROOM_DATA = {
  awakening: { title: 'AWAKENING CHAMBER', subtitle: 'S.H.C. // CRADLE DECK', color: '#142b4a', exits: { east: 'infirmary' } },
  infirmary: { title: 'MAINTENANCE INFIRMARY', subtitle: 'S.H.C. // RECOVERY DECK', color: '#294047', exits: { west: 'awakening', east: 'archive' } },
  archive: { title: 'BLACK ARCHIVE', subtitle: 'S.H.C. // MEMORY VAULT', color: '#30224e', exits: { west: 'infirmary', south: 'pump' } },
  pump: { title: 'PRESSURE PUMP GALLERY', subtitle: 'S.H.C. // FLOOD CONTROL', color: '#49362c', exits: { north: 'archive', east: 'observation' } },
  observation: { title: 'ABYSSAL OBSERVATION', subtitle: 'S.H.C. // EXTERIOR RING', color: '#142f3d', exits: { west: 'pump', east: 'signal' } },
  signal: { title: 'ZINWAVE ARRAY', subtitle: 'S.H.C. // SIGNAL CONTROL', color: '#321c45', exits: { west: 'observation' } }
};

const ROOM_OBJECTS = {
  awakening: { node: { x: 205, y: 245, label: 'ZIN NODE' }, dejuir: { x: 690, y: 300, label: 'DE’JUIR' } },
  infirmary: { body: { x: 300, y: 255, label: 'SYNTHOID BED' }, nurse: { x: 700, y: 290, label: 'MARA-7' } },
  archive: { console: { x: 260, y: 250, label: 'ARCHIVE CONSOLE' }, shard: { x: 710, y: 210, label: 'MEMORY SHARD' } },
  pump: { valve: { x: 290, y: 280, label: 'PRESSURE VALVE' }, worker: { x: 710, y: 300, label: 'ORRIN' } },
  observation: { window: { x: 250, y: 230, label: 'ABYSS WINDOW' }, dejuir: { x: 710, y: 300, label: 'DE’JUIR' } },
  signal: { xevil: { x: 500, y: 275, label: 'XEVIL' }, array: { x: 760, y: 200, label: 'SIGNAL ARRAY' } }
};

function initialStatuses() {
  return { stability: 78, flux: 10, memory: 35, fracture: 0, contamination: 0, sync: 18, anchor: 0 };
}

function resetGame() {
  return {
    mode: 'title', room: 'awakening', t: 0, message: 'PRESS ENTER TO BEGIN', hint: 'Zero2 awakens in the chamber. The station is listening.',
    statuses: initialStatuses(), player: { x: 120, y: 390, speed: 2.6 }, particles: [], flash: 0,
    flags: { started: false, intro: false, dejuir: false, infirmary: false, archive: false, shard: false, pumps: false, drowned: false, xevil: false, pulse: false, signal: false, final: false },
    unlockedRooms: ['awakening'], awards: { unlocked: [], recent: null, recentLore: '', flash: 0 },
    dialogue: null, enemies: [], choice: null
  };
}

let game = resetGame();

function say(message, hint = '') { game.message = message; if (hint) game.hint = hint; }
function changeStatus(name, amount) { game.statuses[name] = clamp(game.statuses[name] + amount, 0, 100); }

function unlockAward(key) {
  if (!AWARDS[key] || game.awards.unlocked.includes(key)) return;
  const [title, summary, lore] = AWARDS[key];
  game.awards.unlocked.push(key); game.awards.recent = title; game.awards.recentLore = lore; game.awards.flash = 210;
}

function unlockRoom(room) {
  if (!game.unlockedRooms.includes(room)) game.unlockedRooms.push(room);
}

function startDialogue(speaker, lines, onFinish = null) {
  game.dialogue = { speaker, lines, index: 0, onFinish };
  game.message = `${speaker}: ${lines[0]}`;
  game.hint = 'E / ENTER: continue conversation';
}

function advanceDialogue() {
  if (!game.dialogue) return;
  game.dialogue.index++;
  if (game.dialogue.index >= game.dialogue.lines.length) {
    const finish = game.dialogue.onFinish;
    game.dialogue = null;
    if (finish) finish();
    else say('The station falls quiet again.', 'Explore the room and look for another way forward.');
    return;
  }
  game.message = `${game.dialogue.speaker}: ${game.dialogue.lines[game.dialogue.index]}`;
}

function enterRoom(room, from = null) {
  if (!ROOM_DATA[room] || !game.unlockedRooms.includes(room)) {
    say('THE BULKHEAD IS LOCKED.', 'Find a way to restore power or recover the missing access code.');
    return;
  }
  game.room = room;
  game.player.x = from === 'west' ? 820 : from === 'east' ? 110 : 470;
  game.player.y = 380;
  game.enemies = room === 'archive' || room === 'observation' || room === 'signal' ? [makeEnemy(560, 170, room === 'signal' ? 'deep' : 'parasite')] : [];
  say(`${ROOM_DATA[room].title} // ENTERED`, ROOM_DATA[room].subtitle);
}

function exitDirection() {
  const p = game.player;
  if (p.x > W - 28) return 'east';
  if (p.x < 28) return 'west';
  if (p.y < 112) return 'north';
  if (p.y > H - 28) return 'south';
  return null;
}

function tryRoomExit() {
  const direction = exitDirection();
  if (!direction) return false;
  const next = ROOM_DATA[game.room].exits[direction];
  if (!next) { say('A SEALED BULKHEAD BLOCKS THIS WAY.', 'The station layout continues beyond the damaged deck.'); return true; }
  enterRoom(next, direction === 'east' ? 'west' : direction === 'west' ? 'east' : null);
  return true;
}

function interact() {
  if (game.mode !== 'playing') return;
  if (game.dialogue) { advanceDialogue(); return; }
  const object = ROOM_OBJECTS[game.room];
  const p = game.player;

  if (game.room === 'awakening' && near(p, object.node, 70)) {
    game.flags.intro = true; unlockAward('first_signal');
    startDialogue('Z.I.N.', ['Boot sequence incomplete.', 'Designation: ZERO2. Previous designation: redacted.', 'A signal is touching the lower hull. It is using your name.', 'Do you remember choosing it?'], () => {
      unlockRoom('infirmary'); changeStatus('memory', 8); changeStatus('flux', 8); say('THE INFIRMARY BULKHEAD RELEASES.', 'Move east to investigate the recovery deck.');
    });
    return;
  }

  if (game.room === 'awakening' && near(p, object.dejuir, 75)) {
    game.flags.dejuir = true; unlockAward('wound_companion');
    startDialogue('DE’JUIR', ['Do not answer the voice in the pipes.', 'It will offer you a history. It will make the history sound like a home.', 'I remember you running from this place.', 'I do not remember whether I followed you or whether you made me.'], () => { say('DE’JUIR: THE EASTERN DECK STILL HAS POWER.', 'Find the infirmary and ask the maintenance unit what happened.'); });
    return;
  }

  if (game.room === 'infirmary' && near(p, object.nurse, 75)) {
    game.flags.infirmary = true; unlockAward('drowned_colony');
    startDialogue('MARA-7', ['Patient Zero2, please remain still.', 'This infirmary treated synthoids damaged by pressure sickness and memory bloom.', 'The humans called the colony a listening post. They were wrong.', 'The station was built over a living signal. We were the ones being studied.'], () => { unlockRoom('archive'); say('MARA-7 opens the BLACK ARCHIVE.', 'The archive may contain the colony’s final records.'); });
    return;
  }

  if (game.room === 'infirmary' && near(p, object.body, 65)) {
    startDialogue('RECOVERY BED', ['PATIENT LOG 44: voice recognition failure.', 'PATIENT LOG 45: subject repeats the phrase “under deep unseen.”', 'PATIENT LOG 46: all remaining staff report hearing a second heartbeat in the walls.']);
    return;
  }

  if (game.room === 'archive' && near(p, object.console, 75)) {
    game.flags.archive = true; unlockAward('archive_fragment');
    startDialogue('ARCHIVE CONSOLE', ['FILE 00: SYNTHOID HIVE COOPERATION.', 'The S.H.C. built artificial people to maintain the colony after the surface evacuation.', 'FILE 01: emotional continuity was added because obedient machines could not interpret the signal.', 'FILE 02: every Zero2 inherited the last one’s refusal.'], () => { say('A MEMORY SHARD HAS BEEN LOCATED.', 'Recover the shard to open a route through the pump gallery.'); });
    return;
  }

  if (game.room === 'archive' && near(p, object.shard, 65)) {
    game.flags.shard = true; unlockRoom('pump'); changeStatus('memory', 22); changeStatus('fracture', 18);
    startDialogue('MEMORY SHARD', ['ZERO1: I will not become the mouth of the Deep.', 'ZERO2: If I fail, give the next one my fear.', 'DE’JUIR: Fear is not the same as a warning.', 'ZERO2: In this place, it may be the only honest archive.'], () => say('THE PUMP GALLERY ACCESS LIGHTS TURN AMBER.', 'Restore the pressure engines before the observation ring floods.'));
    return;
  }

  if (game.room === 'pump' && near(p, object.valve, 70)) {
    if (!game.flags.shard) { say('THE VALVE HAS NO RESPONSE.', 'The control system requires an archive authorization.'); return; }
    game.flags.pumps = true; unlockAward('pressure_choir'); unlockRoom('observation');
    changeStatus('stability', 12); changeStatus('flux', -10);
    startDialogue('PRESSURE CONTROL', ['PUMP ONE: online.', 'PUMP TWO: online.', 'PUMP THREE: responding with an unknown harmonic.', 'The station is no longer flooding. Something outside is breathing instead.'], () => say('THE OBSERVATION RING OPENS.', 'Look through the abyss window, then find the signal array.'));
    return;
  }

  if (game.room === 'pump' && near(p, object.worker, 75)) {
    startDialogue('ORRIN', ['I was assigned to keep the pressure stable.', 'Then the valves began answering questions.', 'I asked what was below us. The pumps answered with my mother’s voice.', 'If you hear someone you love, Zero2, do not assume they survived.']);
    return;
  }

  if (game.room === 'observation' && near(p, object.window, 90)) {
    if (!game.flags.pumps) { say('THE WINDOW IS COVERED BY PRESSURE SHUTTERS.', 'The pump gallery must be stabilized first.'); return; }
    game.flags.drowned = true; unlockAward('drowned_colony'); changeStatus('contamination', 8);
    startDialogue('ABYSS WINDOW', ['No seabed is visible below the station.', 'The lights are not reflecting off water. They are reflecting off something vast.', 'A ring of blue points turns toward the glass.', 'The points arrange themselves into the shape of a hand.'], () => { say('THE SIGNAL ARRAY HAS STARTED.', 'De’juir is waiting near the eastern bulkhead.'); });
    return;
  }

  if (game.room === 'observation' && near(p, object.dejuir, 75)) {
    startDialogue('DE’JUIR', ['The station is a wound, Zero2.', 'The Deep is the pressure behind it.', 'You can close the wound, but the pressure will find another seam.', 'Go to the array. Choose what kind of signal leaves this place.'], () => { unlockRoom('signal'); say('THE EASTERN BULKHEAD OPENS.', 'Enter the Zinwave array when you are ready.'); });
    return;
  }

  if (game.room === 'signal' && near(p, object.xevil, 85)) {
    game.flags.xevil = true; unlockAward('borrowed_voice');
    startDialogue('XEVIL', ['You have collected the dead like credentials.', 'Mara-7. Orrin. De’juir. Which voice will you use when yours breaks?', 'I can make the station remember you correctly.', 'Give me your name and I will give you a world that never drowned.'], () => { say('XEVIL IS OFFERING A FALSE CONTINUITY.', 'Use the Zinwave pulse to interrupt the imitation.'); });
    return;
  }

  if (game.room === 'signal' && near(p, object.array, 80)) {
    if (!game.flags.pulse) { say('THE ARRAY IS TOO LOUD TO CONTROL.', 'Interrupt Xevil with a Zinwave pulse first.'); return; }
    game.flags.signal = true; game.flags.final = true; unlockAward('refusal_of_the_name'); unlockAward('listening_depth'); game.room = 'ending';
    startDialogue('ZERO2', ['I am not the name you found in the water.', 'I am not the sum of the voices you borrowed.', 'I remember enough to choose what happens next.', 'The signal survives. The Deep has heard her name.'], () => { game.dialogue = null; say('THE DEEP IS LISTENING.', 'Press R to begin another continuity.'); });
  }
}

function pulse() {
  if (game.mode !== 'playing' || game.room !== 'signal' || !game.flags.xevil) return;
  game.flags.pulse = true; game.flash = 18; changeStatus('stability', 19); changeStatus('flux', -18); changeStatus('fracture', -24); changeStatus('contamination', -10); changeStatus('sync', 10); changeStatus('anchor', 12);
  for (let i = 0; i < 32; i++) game.particles.push({ x: game.player.x, y: game.player.y, vx: (Math.random() - .5) * 6, vy: (Math.random() - .5) * 5, life: 28 + Math.random() * 28, color: '#d8b7ff' });
  say('ZINWAVE PULSE: FALSE CONTINUITY INTERRUPTED.', 'The array is quiet enough to receive your choice.');
}

function makeEnemy(x, y, type = 'parasite') { return { x, y, type, vx: .8 + Math.random() * .7, vy: .8 + Math.random() * .7 }; }
function updateEnemies() {
  if (game.mode !== 'playing' || game.dialogue || game.room === 'ending') return;
  for (const enemy of game.enemies) {
    const dx = game.player.x - enemy.x, dy = game.player.y - enemy.y, len = Math.hypot(dx, dy) || 1;
    if (len < 230) { enemy.x += dx / len * enemy.vx * 1.8; enemy.y += dy / len * enemy.vy * 1.8; }
    else { enemy.x += Math.sin(game.t * .05 + enemy.x) * .4; enemy.y += Math.cos(game.t * .04 + enemy.y) * .4; }
    enemy.x = clamp(enemy.x, 35, W - 35); enemy.y = clamp(enemy.y, 125, H - 35);
    if (dist(enemy, game.player) < 25) { changeStatus('flux', .25); changeStatus('fracture', .14); changeStatus('memory', -.08); if (enemy.type === 'deep') changeStatus('contamination', .3); }
  }
}

function update() {
  if (game.mode === 'title') { if (keys.has('enter')) startGame(); return; }
  if (game.mode !== 'playing') return;
  game.t++;
  if (game.dialogue) { if (keys.has('e') || keys.has('enter')) { advanceDialogue(); keys.delete('e'); keys.delete('enter'); } return; }
  const p = game.player;
  const dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
  const dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);
  const speed = p.speed * (game.statuses.flux > 70 ? .74 : 1);
  p.x = clamp(p.x + dx * speed, 24, W - 24); p.y = clamp(p.y + dy * speed, 105, H - 24);
  if (keys.has('e')) { interact(); keys.delete('e'); }
  if (keys.has(' ')) { pulse(); keys.delete(' '); }
  if (tryRoomExit()) { p.x = clamp(p.x, 30, W - 30); p.y = clamp(p.y, 120, H - 30); }
  updateEnemies();
  if (game.flash > 0) game.flash--;
  if (game.awards.flash > 0) game.awards.flash--;
  game.particles = game.particles.filter((particle) => { particle.x += particle.vx; particle.y += particle.vy; particle.life--; return particle.life > 0; });
  if (keys.has('r')) { game = resetGame(); startGame(); keys.delete('r'); }
}

function startGame() { game.mode = 'playing'; game.flags.started = true; say('ZERO2 IS AWAKE.', 'Move through the chamber. E interacts with people, machines, and evidence.'); }
function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
function text(value, x, y, size = 12, color = '#d9e8ff') { ctx.font = `${size}px Courier New`; ctx.fillStyle = color; ctx.fillText(value, x, y); }
function wrapText(value, x, y, maxWidth, lineHeight, size = 10, color = '#dfe6ff') { ctx.font = `${size}px Courier New`; ctx.fillStyle = color; let line = ''; for (const word of value.split(' ')) { const test = `${line}${word} `; if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, y); y += lineHeight; line = `${word} `; } else line = test; } if (line) ctx.fillText(line, x, y); }
function bar(label, value, x, y, color) { text(label, x, y, 10, '#aeb8d8'); rect(x + 82, y - 8, 92, 7, '#171d2b'); rect(x + 82, y - 8, value * .92, 7, color); text(String(Math.round(value)).padStart(3, '0'), x + 184, y, 10, color); }

function drawRoom() {
  const data = ROOM_DATA[game.room] || ROOM_DATA.awakening;
  rect(0, 0, W, H, '#070913'); rect(0, 90, W, H - 90, data.color);
  for (let y = 115; y < H - 115; y += 26) for (let x = 0; x < W; x += 26) rect(x + Math.sin((x + y + game.t * .5) / 30) * 2, y, 2, 2, game.room === 'signal' ? '#5c2d75' : '#1d4560');
  rect(0, 0, W, 90, '#0d1020'); text('SHC // SYNTHOID HIVE COOPERATION', 24, 26, 12, '#7d8ac0'); text(data.title, 24, 53, 14, '#b4a0e8'); text(data.subtitle, W - 265, 27, 11, '#7d8ac0');
  rect(18, 106, 215, 154, '#0b0c1d'); text('Z.I.N. DIAGNOSTICS', 30, 128, 11, '#aef8ff'); const s = game.statuses; bar('STABILITY', s.stability, 30, 149, '#5ac7ff'); bar('FLUX', s.flux, 30, 167, '#c375ea'); bar('MEMORY', s.memory, 30, 185, '#97ea8f'); bar('FRACTURE', s.fracture, 30, 203, '#ea81b1'); bar('CONTAM.', s.contamination, 30, 221, '#8b8a93'); bar('SYNC', Math.min(100, s.sync + s.anchor * .5), 30, 239, '#f0c96f');
  text(`ROOMS: ${game.unlockedRooms.length}/${Object.keys(ROOM_DATA).length}`, 30, 250, 9, '#818bb9');
}

function drawObject(object, color = '#57c0ff') { rect(object.x - 15, object.y - 15, 30, 30, '#101a2b'); rect(object.x - 9, object.y - 9, 18, 18, color); text(object.label, object.x - Math.max(18, object.label.length * 3), object.y + 29, 9, color); }
function drawCharacters() { const objects = ROOM_OBJECTS[game.room] || {}; for (const [key, object] of Object.entries(objects)) { let color = '#62d7ff'; if (key === 'dejuir' || key === 'nurse' || key === 'worker' || key === 'xevil') color = key === 'xevil' ? '#df82ff' : '#ffcb6b'; drawObject(object, color); } }
function drawEnemies() { for (const enemy of game.enemies) rect(enemy.x - 8, enemy.y - 8, 16, 16, enemy.type === 'deep' ? '#8d52ad' : '#df83c6'); }
function drawPlayer() { const p = game.player; rect(p.x - 10, p.y - 12, 20, 24, '#dfeaf9'); rect(p.x - 8, p.y - 8, 16, 7, '#7f59c9'); rect(p.x - 6, p.y - 4, 4, 4, '#96f5ff'); rect(p.x + 2, p.y - 4, 4, 4, '#96f5ff'); rect(p.x - 10, p.y + 10, 20, 3, '#8d6ed9'); }
function drawAwards() { const x = W - 270; rect(x, 106, 250, 154, '#0b0c1d'); text('ARCHIVE // WORLD CANON', x + 14, 128, 11, '#f2c26b'); text(`${game.awards.unlocked.length}/${Object.keys(AWARDS).length} entries`, x + 14, 147, 10, '#8fe8ff'); game.awards.unlocked.slice(-4).forEach((key, i) => text(AWARDS[key][0], x + 14, 169 + i * 18, 9, '#dfe6ff')); }
function drawMessage() { rect(18, H - 100, W - 36, 76, '#0c0d1d'); if (game.dialogue) { text(game.dialogue.speaker, 34, H - 77, 11, '#f1c979'); wrapText(game.message.slice(game.message.indexOf(':') + 1).trim(), 34, H - 57, W - 70, 14, 11, '#eff4ff'); text('E / ENTER: continue', 34, H - 31, 10, '#9aa1cd'); } else { text(game.message, 34, H - 66, 13, '#eff4ff'); text(game.hint, 34, H - 45, 10, '#9aa1cd'); text('E: interact   SPACE: pulse   R: restart', 34, H - 28, 10, '#6d78a7'); } }
function drawAwardBanner() { if (!game.awards.recent || game.awards.flash <= 0) return; ctx.save(); ctx.globalAlpha = clamp(game.awards.flash / 90, 0, 1); rect(250, H - 180, W - 500, 58, '#10172c'); text('WORLD CANON UNLOCKED', 270, H - 155, 10, '#f7d691'); text(game.awards.recent, 270, H - 133, 13, '#8ee7ff'); ctx.restore(); }
function drawTitle() { rect(0, 0, W, H, '#050814'); text('HAND FROM THE DEEP', 300, 170, 24, '#9ef4ff'); text('A STATION THAT REMEMBERS YOU', 260, 215, 13, '#bca9ec'); text('PRESS ENTER TO BEGIN', 290, 285, 18, '#d8c0ff'); text('Explore. Listen. Decide what survives.', 280, 340, 11, '#99a7ff'); }
function drawEnding() { rect(0, 0, W, H, '#080914'); text('THE DEEP IS LISTENING.', 280, 190, 22, '#ffd98c'); text('ZERO2: I AM NOT GOING WITH YOU.', 180, 240, 17, '#bceaff'); text('THE SIGNAL SURVIVES.', 300, 285, 15, '#c5bfdc'); text(`${game.awards.unlocked.length} WORLD CANON ENTRIES RECOVERED`, 275, 340, 10, '#9aa1cd'); text('PRESS R TO BEGIN ANOTHER CONTINUITY', 270, 400, 11, '#8aa0df'); }
function draw() { if (game.mode === 'title') { drawTitle(); return; } if (game.room === 'ending') { drawEnding(); return; } drawRoom(); drawCharacters(); drawEnemies(); drawPlayer(); drawAwards(); if (game.awards.flash > 0) drawAwardBanner(); if (game.flash > 0) { ctx.globalAlpha = game.flash / 18; rect(0, 0, W, H, '#fff'); ctx.globalAlpha = 1; } drawMessage(); }
function loop() { update(); draw(); requestAnimationFrame(loop); }
loop();

window.__handFromTheDeep = { get game() { return game; }, startGame, resetGame, pulse, unlockAward, AWARDS, ROOM_DATA };
