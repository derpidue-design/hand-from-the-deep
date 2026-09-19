/* Hand from the Deep — browser-playable 16-bit vertical slice.
 * Original story canon: derpidue-design.
 * No external assets or libraries are required.
 */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width, H = canvas.height;
const keys = new Set();
addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); if ([' ', 'arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const near = (a,b,r=42) => dist(a,b) < r;

const initialStatuses = () => ({ stability: 78, flux: 8, memory: 28, fracture: 0, contamination: 0, sync: 18, anchor: 0 });
let game;
function reset() {
  game = {
    scene: 'awakening', t: 0, message: 'ZERO2 IS AWAKE. FIND A WAY OUT.', hint: 'Move through the chamber and inspect the blue node.',
    statuses: initialStatuses(), flags: { memory: false, diagnosis: false, xevil: false, pulse: false, choice: false }, choice: null,
    player: { x: 132, y: 385, w: 18, h: 24, speed: 2.6 }, dejuir: { x: 480, y: 300 }, shard: { x: 745, y: 170 }, node: { x: 210, y: 170 }, xevil: { x: 785, y: 370 }, particles: [], flash: 0
  };
}
reset();

function say(message, hint='') { game.message = message; if (hint) game.hint = hint; }
function changeStatus(name, amount) { game.statuses[name] = clamp(game.statuses[name] + amount, 0, 100); }
function interact() {
  const p = game.player;
  if (game.scene === 'awakening' && near(p, game.node, 58)) {
    game.flags.diagnosis = true; game.scene = 'diagnostic';
    say('Z.I.N. STATUS: ACTIVE / LINK: DEGRADED', 'De’juir is near. Approach the older Synthoid.');
    changeStatus('memory', 8); changeStatus('flux', 6); return;
  }
  if (game.scene === 'diagnostic' && near(p, game.dejuir, 62)) {
    game.flags.diagnosis = true; game.scene = 'explore';
    say('DE’JUIR: Your node is reacting to emotional activity.', 'Find the memory fragment before the chamber changes again.');
    changeStatus('sync', 12); changeStatus('stability', 5); return;
  }
  if (game.scene === 'explore' && near(p, game.shard, 58)) {
    game.flags.memory = true; game.scene = 'xevil';
    say('MEMORY FRAGMENT RECOVERED: YOU ARE NOT THE FIRST ZERO2.', 'A voice is approaching. Use the Zinwave pulse when the distortion peaks.');
    changeStatus('memory', 22); changeStatus('flux', 24); changeStatus('fracture', 18); return;
  }
  if (game.scene === 'xevil' && near(p, game.dejuir, 70)) {
    say('DE’JUIR: Hold on to what happened. Your version number does not determine your worth.', 'Press SPACE to pulse the Zinwave node.');
    changeStatus('sync', 10); changeStatus('anchor', 15); return;
  }
  if (game.scene === 'choice' && near(p, game.node, 70)) {
    game.choice = 'signal'; game.flags.choice = true; game.scene = 'ending';
    say('ZERO2: I am not going with you.', 'The V.R.P. opens. Something beyond the Deep has heard your name.');
  }
}
function pulse() {
  if (!['xevil','choice'].includes(game.scene)) return;
  game.flags.pulse = true; game.flash = 12;
  changeStatus('stability', 15); changeStatus('flux', -18); changeStatus('fracture', -22); changeStatus('contamination', -5); changeStatus('anchor', 20); changeStatus('sync', 8);
  for (let i=0;i<26;i++) game.particles.push({x:game.player.x,y:game.player.y,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5,life:30+Math.random()*30,c:'#d8a7ff'});
  if (game.scene === 'xevil') { game.scene = 'choice'; say('XEVIL: That is impossible.', 'Choose: touch the dark node to follow the signal, or resist and remain here.'); }
}
function update() {
  if (keys.has('r')) { reset(); keys.delete('r'); }
  game.t++;
  const p = game.player;
  let dx=(keys.has('d')||keys.has('arrowright'))- (keys.has('a')||keys.has('arrowleft'));
  let dy=(keys.has('s')||keys.has('arrowdown'))- (keys.has('w')||keys.has('arrowup'));
  const speed = p.speed * (game.statuses.flux > 75 ? .72 : 1);
  p.x=clamp(p.x+dx*speed, 38, W-38); p.y=clamp(p.y+dy*speed, 116, H-48);
  if (keys.has('e')) { interact(); keys.delete('e'); }
  if (keys.has(' ')) { pulse(); keys.delete(' '); }
  if (game.scene === 'xevil') { changeStatus('flux', .018); changeStatus('fracture', .012); changeStatus('contamination', .008); }
  if (game.scene === 'choice') { changeStatus('fracture', -.01); }
  game.flash = Math.max(0, game.flash-1);
  game.particles = game.particles.filter(x => x.life-- > 0); game.particles.forEach(x=>{x.x+=x.vx;x.y+=x.vy;});
}
function rect(x,y,w,h,c) { ctx.fillStyle=c; ctx.fillRect(Math.round(x),Math.round(y),w,h); }
function text(s,x,y,size=14,c='#d9e8ff') { ctx.font=`${size}px Courier New`; ctx.fillStyle=c; ctx.fillText(s,x,y); }
function bar(label, value, x, y, c) { text(label,x,y,11,'#aab1df'); rect(x+94,y-10,110,8,'#17172f'); rect(x+94,y-10,Math.round(value*1.1),8,c); text(String(Math.round(value)).padStart(3,'0'),x+211,y,11,c); }
function drawBackground() {
  rect(0,0,W,H,'#080817');
  for(let y=110;y<H;y+=24) for(let x=0;x<W;x+=24) { const wave=Math.sin((x+y+game.t*.7)/35)*2; rect(x+wave,y,1,1, game.scene==='xevil'?'#3c244d':'#172050'); }
  ctx.strokeStyle=game.scene==='xevil'?'#7c2c87':'#294f9b'; ctx.lineWidth=2;
  for(let i=0;i<7;i++){ ctx.beginPath();ctx.moveTo(0,150+i*55);ctx.lineTo(W,100+i*65);ctx.stroke(); }
  rect(0,0,W,98,'#0d0d22'); text('SHC // SYNTHOID HIVE COOPERATION',22,27,14,'#7277b8'); text(game.scene.toUpperCase(),22,53,12,'#a78bd1'); text('HAND FROM THE DEEP // VERTICAL SLICE',W-330,27,12,'#7277b8');
}
function drawObject(o, c, label) { const pulse=2+Math.sin(game.t/8)*2; rect(o.x-12-pulse/2,o.y-12-pulse/2,24+pulse,24+pulse,'#17204e'); rect(o.x-8,o.y-8,16,16,c); text(label,o.x-35,o.y+34,10,c); }
function drawPlayer() { const p=game.player; rect(p.x-9,p.y-12,18,24,'#d5e6ed'); rect(p.x-7,p.y-8,14,7,'#744cb1'); rect(p.x-5,p.y-6,3,3,'#87ffff'); rect(p.x+2,p.y-6,3,3,'#87ffff'); rect(p.x-12,p.y+10,24,3,'#8c64d5'); }
function drawDejuir() { const d=game.dejuir; rect(d.x-13,d.y-17,26,34,'#59657d'); rect(d.x-10,d.y-13,20,11,'#30394e'); rect(d.x-7,d.y-10,4,4,'#ffb84d'); rect(d.x+3,d.y-10,4,4,'#ffb84d'); rect(d.x-17,d.y+15,34,4,'#384258'); text('DE’JUIR',d.x-30,d.y+34,10,'#ffcc72'); }
function drawXevil() { if(!['xevil','choice'].includes(game.scene)) return; const x=game.xevil; const wob=Math.sin(game.t/5)*7; ctx.globalAlpha=.75; rect(x.x-20+wob,x.y-45,40,70,'#180d28'); rect(x.x-30-wob,x.y-13,60,9,'#672d7c'); rect(x.x-13+wob,x.y-27,7,7,'#d48bff'); rect(x.x+7-wob,x.y-27,7,7,'#d48bff'); ctx.globalAlpha=1; text('XEVIL',x.x-24,x.y+42,10,'#df74ef'); }
function drawStatus() { rect(18,112,245,150,'#0b0b20'); text('Z.I.N. DIAGNOSTICS',30,132,12,'#9dfcff'); const s=game.statuses; bar('STABILITY',s.stability,30,151,'#58c7ff');bar('EMOTIONAL FLUX',s.flux,30,169,'#c761e9');bar('MEMORY',s.memory,30,187,'#94e890');bar('FRACTURE',s.fracture,30,205,'#e875a9');bar('DEEP CONTAM.',s.contamination,30,223,'#77707f');bar('SYNC / ANCHOR',Math.min(100,s.sync+s.anchor/2),30,241,'#f0c96f'); }
function drawMessage() { rect(18,H-105,W-36,82,'#0b0b20'); text(game.message,35,H-76,14,'#f1efff'); text(game.hint,35,H-51,12,'#9fa7d4'); text('E: interact   SPACE: Zinwave pulse   R: restart',35,H-27,11,'#6570a8'); }
function draw() {
  drawBackground(); drawStatus();
  if(game.scene==='awakening') { drawObject(game.node,'#4d9dff','ZINWAVE NODE'); }
  if(game.scene==='diagnostic') { drawObject(game.node,'#8d62d8','DIAGNOSTIC'); drawDejuir(); }
  if(game.scene==='explore') { drawDejuir(); drawObject(game.shard,'#b8f3ff','MEMORY'); }
  if(game.scene==='xevil'||game.scene==='choice') { drawDejuir(); drawXevil(); drawObject(game.node,'#d58cff','THE DEEP'); }
  if(game.scene==='ending') { drawDejuir(); drawObject({x:790,y:210},'#ffd77a','SIGNAL'); text('WE SEE YOU.',690,270,18,'#ffd77a'); }
  game.particles.forEach(q=>rect(q.x,q.y,3,3,q.c)); drawPlayer(); drawMessage();
  if(game.flash) { ctx.globalAlpha=game.flash/30; rect(0,0,W,H,'#ffffff'); ctx.globalAlpha=1; }
}
function loop(){ update(); draw(); requestAnimationFrame(loop); } loop();
