const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const keys = new Set();

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  keys.add(k);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const near = (a, b, r = 32) => dist(a, b) < r;

function initialStatuses() {
  return {
    stability: 78,
    flux: 10,
    memory: 35,
    fracture: 0,
    contamination: 0,
    sync: 18,
    anchor: 0
  };
}

function resetGame() {
  return {
    mode: 'title',
    t: 0,
    message: 'PRESS ENTER TO BEGIN',
    hint: 'Zero2 awakens in the chamber. She is not alone.',
    statuses: initialStatuses(),
    scene: 'awakening',
    sceneIndex: 0,
    flags: {
      intro: false,
      memory: false,
      dejuir: false,
      xevil: false,
      pulse: false,
      signal: false,
      final: false,
      started: false
    },
    player: { x: 132, y: 390, w: 18, h: 24, speed: 2.6 },
    dejuir: { x: 490, y: 300 },
    shard: { x: 740, y: 160 },
    node: { x: 220, y: 170 },
    xevil: { x: 770, y: 330 },
    particles: [],
    flash: 0,
    timer: 0,
    enemies: [],
    rooms: {
      awakening: { x: 0, y: 0, w: 960, h: 540 },
      corridor: { x: 0, y: 0, w: 960, h: 540 },
      xevil: { x: 0, y: 0, w: 960, h: 540 },
      ending: { x: 0, y: 0, w: 960, h: 540 }
    }
  };
}

let game = resetGame();

function say(msg, hint = '') {
  game.message = msg;
  if (hint) game.hint = hint;
}

function changeStatus(name, amount) {
  game.statuses[name] = clamp(game.statuses[name] + amount, 0, 100);
}

function makeEnemy(x, y, type = 'parasite') {
  return { x, y, type, vx: 0.8 + Math.random() * 0.7, vy: 0.8 + Math.random() * 0.7, life: 1000 };
}

function spawnEnemies() {
  game.enemies = [
    makeEnemy(570, 220, 'parasite'),
    makeEnemy(680, 390, 'parasite'),
    makeEnemy(820, 280, 'deep')
  ];
}

function startGame() {
  game.mode = 'playing';
  game.flags.started = true;
  game.scene = 'awakening';
  game.message = 'ZERO2 IS AWAKE. FIND A WAY OUT.';
  game.hint = 'WASD/ARROWS move. E to interact. Space to pulse the Zinwave node.';
  spawnEnemies();
}

function interact() {
  const p = game.player;

  if (game.mode !== 'playing') return;

  if (game.scene === 'awakening' && near(p, game.node, 60)) {
    game.flags.intro = true;
    game.scene = 'diagnostic';
    say('Z.I.N. STATUS: ACTIVE / LINK: DEGRADED', 'De’juir is near. Approach the older Synthoid.');
    changeStatus('memory', 8);
    changeStatus('flux', 8);
    return;
  }

  if (game.scene === 'diagnostic' && near(p, game.dejuir, 70)) {
    game.flags.dejuir = true;
    game.scene = 'corridor';
    say('DE’JUIR: YOUR NODE IS RESPONDING TO EMOTIONAL ACTIVITY.', 'Find the memory fragment and avoid the shifting corridor.');
    changeStatus('sync', 12);
    changeStatus('stability', 8);
    return;
  }

  if (game.scene === 'corridor' && near(p, game.shard, 52)) {
    game.flags.memory = true;
    game.scene = 'xevil';
    say('MEMORY FRAGMENT RECOVERED: YOU ARE NOT THE FIRST ZERO2.', 'Xevil is near. Manage the spike before it overwhelms the node.');
    changeStatus('memory', 22);
    changeStatus('flux', 24);
    changeStatus('fracture', 18);
    return;
  }

  if (game.scene === 'xevil' && near(p, game.dejuir, 80)) {
    game.scene = 'choice';
    say('DE’JUIR: HOLD ON TO WHAT REMAINS OF YOU.', 'The corridor is splitting. Use the Zinwave pulse to resist.');
    changeStatus('sync', 16);
    changeStatus('anchor', 16);
    return;
  }

  if (game.scene === 'choice' && near(p, game.node, 72)) {
    game.flags.signal = true;
    game.flags.final = true;
    game.scene = 'ending';
    say('ZERO2: I AM NOT GOING WITH YOU.', 'The signal survives. The Deep has heard her name.');
  }
}

function pulse() {
  if (game.mode !== 'playing') return;
  if (!['xevil', 'choice'].includes(game.scene)) return;

  game.flags.pulse = true;
  game.flash = 18;
  changeStatus('stability', 19);
  changeStatus('flux', -18);
  changeStatus('fracture', -24);
  changeStatus('contamination', -10);
  changeStatus('sync', 10);
  changeStatus('anchor', 12);

  for (let i = 0; i < 28; i++) {
    game.particles.push({
      x: game.player.x,
      y: game.player.y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 5,
      life: 26 + Math.random() * 26,
      color: '#d8b7ff'
    });
  }

  if (game.scene === 'xevil') {
    game.scene = 'choice';
    say('XEVIL: THAT IS IMPOSSIBLE.', 'Choose the signal, or remain and resist the collapse.');
  }
}

function updateEnemyAI() {
  if (game.mode !== 'playing') return;
  const p = game.player;
  for (const enemy of game.enemies) {
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len < 200) {
      enemy.x += (dx / len) * enemy.vx * 2;
      enemy.y += (dy / len) * enemy.vy * 2;
    } else {
      enemy.x += Math.sin(game.t * 0.05 + enemy.x) * 0.4;
      enemy.y += Math.cos(game.t * 0.04 + enemy.y) * 0.4;
    }
    enemy.x = clamp(enemy.x, 20, W - 20);
    enemy.y = clamp(enemy.y, 110, H - 30);

    if (dist(enemy, p) < 26) {
      changeStatus('flux', 0.45);
      changeStatus('fracture', 0.22);
      changeStatus('memory', -0.12);
      if (enemy.type === 'deep') changeStatus('contamination', 0.5);
    }
  }
}

function update() {
  if (game.mode === 'title') {
    if (keys.has('enter')) startGame();
    return;
  }

  if (game.mode === 'playing') {
    game.t++;
    const p = game.player;
    let dx = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
    let dy = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0);

    const speedMultiplier = game.statuses.flux > 70 ? 0.74 : 1;
    p.x = clamp(p.x + dx * p.speed * speedMultiplier, 32, W - 40);
    p.y = clamp(p.y + dy * p.speed * speedMultiplier, 120, H - 42);

    if (keys.has('e')) {
      interact();
      keys.delete('e');
    }

    if (keys.has(' ')) {
      pulse();
      keys.delete(' ');
    }

    if (game.scene === 'xevil') {
      changeStatus('flux', 0.13);
      changeStatus('fracture', 0.1);
      changeStatus('contamination', 0.08);
    }

    if (game.scene === 'choice') {
      changeStatus('fracture', -0.05);
    }

    updateEnemyAI();

    if (game.flash > 0) game.flash--;
    game.particles = game.particles.filter((pt) => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      return pt.life > 0;
    });

    if (keys.has('r')) {
      game = resetGame();
      startGame();
      keys.delete('r');
    }
  }
}

function drawBackground() {
  rect(0, 0, W, H, '#070913');

  for (let y = 110; y < H; y += 24) {
    for (let x = 0; x < W; x += 24) {
      const wave = Math.sin((x + y + game.t * 0.6) / 28) * 2;
      rect(x + wave, y, 2, 2, game.scene === 'xevil' ? '#3b2459' : '#1a2548');
    }
  }

  // Top bar
  rect(0, 0, W, 90, '#0d1020');
  text('SHC // SYNTHOID HIVE COOPERATION', 24, 26, 12, '#7d8ac0');
  text(game.scene.toUpperCase(), 24, 52, 14, '#b4a0e8');
  text('HAND FROM THE DEEP // 16-BIT VERTICAL SLICE', W - 325, 27, 12, '#7d8ac0');
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function text(str, x, y, size = 12, color = '#d9e8ff') {
  ctx.font = `${size}px Courier New`;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function bar(label, value, x, y, color) {
  text(label, x, y, 11, '#aeb8d8');
  rect(x + 110, y - 8, 110, 8, '#171d2b');
  rect(x + 110, y - 8, value * 1.1, 8, color);
  text(String(Math.round(value)).padStart(3, '0'), x + 225, y, 11, color);
}

function drawStatusPanel() {
  rect(18, 110, 250, 160, '#0b0c1d');
  text('Z.I.N. DIAGNOSTICS', 30, 132, 12, '#aef8ff');
  const s = game.statuses;
  bar('STABILITY', s.stability, 30, 152, '#5ac7ff');
  bar('FLUX', s.flux, 30, 170, '#c375ea');
  bar('MEMORY', s.memory, 30, 188, '#97ea8f');
  bar('FRACTURE', s.fracture, 30, 206, '#ea81b1');
  bar('CONTAM.', s.contamination, 30, 224, '#8b8a93');
  bar('SYNC', Math.min(100, s.sync + s.anchor * 0.5), 30, 242, '#f0c96f');
}

function drawPlayer() {
  const p = game.player;
  rect(p.x - 10, p.y - 12, 20, 24, '#dfeaf9');
  rect(p.x - 8, p.y - 8, 16, 7, '#7f59c9');
  rect(p.x - 6, p.y - 4, 4, 4, '#96f5ff');
  rect(p.x + 2, p.y - 4, 4, 4, '#96f5ff');
  rect(p.x - 10, p.y + 10, 20, 3, '#8d6ed9');
}

function drawDejuir() {
  const d = game.dejuir;
  rect(d.x - 13, d.y - 17, 26, 34, '#5b687e');
  rect(d.x - 10, d.y - 12, 20, 11, '#2d394e');
  rect(d.x - 8, d.y - 10, 4, 4, '#ffbd59');
  rect(d.x + 4, d.y - 10, 4, 4, '#ffbd59');
  rect(d.x - 18, d.y + 15, 36, 4, '#3a495d');
  text('DE’JUIR', d.x - 30, d.y + 34, 10, '#ffcb6b');
}

function drawNode(x, y, label, color = '#57c0ff') {
  rect(x - 16, y - 16, 32, 32, '#12182d');
  rect(x - 10, y - 10, 20, 20, color);
  text(label, x - 26, y + 32, 10, color);
}

function drawShard(x, y) {
  rect(x - 10, y - 10, 20, 20, '#c6f5ff');
  rect(x - 6, y - 6, 12, 12, '#83d6ff');
  text('MEMORY', x - 22, y + 26, 10, '#c6f5ff');
}

function drawXevil() {
  if (!['xevil', 'choice', 'ending'].includes(game.scene)) return;
  const x = game.xevil;
  const wob = Math.sin(game.t * 0.06) * 7;
  rect(x.x - 18 + wob, x.y - 28, 36, 52, '#1c142a');
  rect(x.x - 30 - wob, x.y - 8, 60, 10, '#70358d');
  rect(x.x - 12 + wob, x.y - 16, 8, 8, '#d58dff');
  rect(x.x + 5 - wob, x.y - 16, 8, 8, '#d58dff');
  text('XEVIL', x.x - 24, x.y + 32, 10, '#e98aff');
}

function drawEnemies() {
  for (const enemy of game.enemies) {
    const c = enemy.type === 'deep' ? '#7b4ca0' : '#e38acc';
    rect(enemy.x - 8, enemy.y - 8, 16, 16, c);
  }
}

function drawParticles() {
  for (const p of game.particles) {
    rect(p.x, p.y, 3, 3, p.color);
  }
}

function drawMessage() {
  rect(18, H - 112, W - 36, 88, '#0c0d1d');
  text(game.message, 36, H - 78, 14, '#eff4ff');
  text(game.hint, 36, H - 52, 12, '#9aa1cd');
  text('E: interact   SPACE: Zinwave pulse   R: restart', 36, H - 28, 11, '#6d78a7');
}

function drawTitleScreen() {
  rect(0, 0, W, H, '#050814');
  text('HAND FROM THE DEEP', 300, 180, 24, '#9ef4ff');
  text('PRESS ENTER TO BEGIN', 290, 260, 18, '#d8c0ff');
  text('ZERO2 AWAKE. DEEP SIGNAL HEARD.', 260, 330, 12, '#99a7ff');
  text('SYNTHOID HIVE COOPERATION // UNDER DEEP UNSEEN', 210, 360, 11, '#7d86cf');
}

function drawEnding() {
  rect(0, 0, W, H, '#0a0c17');
  text('THE DEEP IS LISTENING.', 280, 200, 22, '#ffd98c');
  text('ZERO2: I AM NOT GOING WITH YOU.', 180, 260, 18, '#bceaff');
  text('THE SIGNAL SURVIVES.', 300, 320, 16, '#c5bfdc');
  text('PRESS R TO RESTART', 330, 400, 12, '#8aa0df');
}

function draw() {
  if (game.mode === 'title') {
    drawTitleScreen();
    return;
  }

  drawBackground();
  drawStatusPanel();

  if (game.scene === 'awakening' || game.scene === 'diagnostic') {
    drawNode(game.node.x, game.node.y, 'NODE', '#57d0ff');
  }

  if (game.scene === 'diagnostic' || game.scene === 'corridor' || game.scene === 'xevil' || game.scene === 'choice') {
    drawDejuir();
  }

  if (game.scene === 'corridor' || game.scene === 'xevil' || game.scene === 'choice') {
    drawShard(game.shard.x, game.shard.y);
  }

  if (game.scene === 'xevil' || game.scene === 'choice' || game.scene === 'ending') {
    drawXevil();
  }

  drawEnemies();
  drawPlayer();
  drawParticles();
  drawMessage();

  if (game.flash > 0) {
    ctx.globalAlpha = game.flash / 18;
    rect(0, 0, W, H, '#ffffff');
    ctx.globalAlpha = 1;
  }

  if (game.scene === 'ending') {
    drawEnding();
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();

// Expose a tiny debug mode for local testing in devtools
window.__handFromTheDeep = { game, startGame, resetGame, pulse };
