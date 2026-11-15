/* =====================================================
   HYDRUS 2040 — MARS WORLD (movement prototype)
   Side view. Each player has 3 keys:
     left / right : TAP to walk that way, tap again to stop (no need to hold)
     middle       : jump, or interact when something is nearby
   Tapping instead of holding avoids the keyboard limit
   (many laptop keyboards can't read 4+ held keys at once).
   ===================================================== */

const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const W = 1280, H = 720, WORLD_W = 2900;
const GRAVITY = 520;          // Mars: 0.38 g (Earth would be ~1370 in these units)
const WALK = 200, JUMP = -430;

/* ---------- Players ---------- */
const PLAYERS = [
  { name: 'Vale',  shape: '▲', color: '#38bdf8', keys: ['KeyQ', 'KeyW', 'KeyE'],                  labels: ['Q', 'W', 'E'] },
  { name: 'Emi',   shape: '■', color: '#f59e0b', keys: ['KeyC', 'KeyV', 'KeyB'],                  labels: ['C', 'V', 'B'] },
  { name: 'Oscar', shape: '●', color: '#a78bfa', keys: ['KeyI', 'KeyO', 'KeyP'],                  labels: ['I', 'O', 'P'] },
  { name: 'Marco', shape: '◆', color: '#22c55e', keys: ['ArrowLeft', 'ArrowDown', 'ArrowRight'], labels: ['←', '↓', '→'] }
].map((p, i) => ({ ...p, x: 380 + i * 75, y: 0, vx: 0, vy: 0, dir: 0, face: 1, onGround: true,
  carry: null, anim: 0, stepT: 0, pressed: [-9, -9, -9] }));

/* ---------- Terrain with relief ---------- */
function ground(x) {
  let y = 560 + 28 * Math.sin(x / 300) + 14 * Math.sin(x / 95 + 1);
  y += 70 * Math.exp(-Math.pow((x - 1850) / 120, 2));     // crater dip
  const flat = Math.exp(-Math.pow((x - 520) / 300, 6));   // flat ground under the base
  return y * (1 - flat) + 575 * flat;
}
const ROCKS = [{ x: 1080, w: 70, h: 55 }, { x: 1600, w: 60, h: 42 }, { x: 2150, w: 90, h: 68 }];
ROCKS.forEach((r) => { r.top = ground(r.x) - r.h + 6; });

/* ---------- Things to interact with ---------- */
const SAMPLES = [{ id: 'A', x: 1360, taken: false }, { id: 'B', x: 2400, taken: false }];
const LAB = { x: 655 }, ANTENNA = { x: 360 };
const state = { pending: 0, sent: 0, goal: 24, clock: 90, time: 0, msg: '', msgT: 0 };
function say(text) { if (state.msg !== text) { state.msg = text; state.msgT = state.time; } }
say("Find samples A and B and bring them to the lab. Tap ← → to walk, tap again to stop. Middle key: jump or interact.");

function nearby(p) {
  if (p.carry && Math.abs(p.x - LAB.x) < 50) return { kind: 'lab', label: 'DELIVER' };
  if (!p.carry) for (const s of SAMPLES) if (!s.taken && Math.abs(p.x - s.x) < 34) return { kind: 'sample', s, label: 'PICK UP' };
  if (state.pending > 0 && Math.abs(p.x - ANTENNA.x) < 50) return { kind: 'antenna', label: 'SEND DATA' };
  return null;
}

/* ---------- Effects ---------- */
const parts = [], popups = [];
function puff(x, y, n, col = '#fdba74', spread = 60) {
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * spread, vy: -Math.random() * 40 - 10,
    life: 0, max: .5 + Math.random() * .4, size: 3 + Math.random() * 5, col });
}
function sparkle(x, y, col) {
  for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, v = 60 + Math.random() * 120;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: .6, size: 3, col, glow: true }); }
}
function popup(x, y, text, col) { popups.push({ x, y, text, col, life: 0 }); }
let beam = 0;

/* ---------- Input (taps, not holds) ---------- */
function press(i, k) {               // k: 0 = left, 1 = middle, 2 = right
  const p = PLAYERS[i];
  p.pressed[k] = state.time;
  if (k === 0 || k === 2) {
    const d = k === 0 ? -1 : 1;
    p.dir = p.dir === d ? 0 : d;     // tap = walk that way, tap again = stop
    if (p.dir) p.face = p.dir;
    return;
  }
  const n = nearby(p);
  if (n && n.kind === 'sample') {
    n.s.taken = true; p.carry = n.s.id; sparkle(n.s.x, ground(n.s.x) - 30, '#86efac');
    popup(p.x, p.y - 90, `SAMPLE ${n.s.id}!`, '#86efac');
    const left = SAMPLES.filter((s) => !s.taken).length;
    say(left ? `Got sample ${n.s.id}! Keep going: the next one is past the crater.` : 'Both samples! Head back to Hydrus Base.');
  } else if (n && n.kind === 'lab') {
    state.pending += 12; popup(LAB.x, p.y - 100, '+12 DATA', '#7dd3fc'); sparkle(LAB.x, p.y - 40, '#7dd3fc'); p.carry = null;
    say('Analyzing... +12 data points! Comms: tap your middle key at the antenna to send them home.');
  } else if (n && n.kind === 'antenna') {
    const chunk = Math.min(4, state.pending);          // with high-gain antenna: 4 per tap
    state.pending -= chunk; state.sent += chunk; beam = 1;
    popup(ANTENNA.x + 30 + (state.sent % 3) * 30, 240, `+${chunk} SENT`, '#c4b5fd');
    if (!state.pending && state.sent >= state.goal) say('Data received on Earth! Great work, crew.');
  } else if (p.onGround) {
    p.vy = JUMP; p.onGround = false; puff(p.x, p.y, 8);
  }
}
addEventListener('keydown', (e) => {
  if (e.repeat) return;              // holding a key does nothing extra
  PLAYERS.forEach((p, i) => { const k = p.keys.indexOf(e.code); if (k >= 0) { e.preventDefault(); press(i, k); } });
});

/* ---------- Physics (fixed steps) ---------- */
let camX = 0;
function surfaceAt(x, prevY) {
  let s = ground(x);
  for (const r of ROCKS) if (Math.abs(x - r.x) < r.w / 2 + 8 && prevY <= r.top + 8) s = Math.min(s, r.top);
  return s;
}
function step(dt) {
  state.time += dt; state.clock = Math.max(0, state.clock - dt);
  for (const p of PLAYERS) {
    const prevY = p.y, oldX = p.x;
    p.x += p.dir * WALK * dt;
    for (const r of ROCKS) {         // rocks block you unless you jump over them
      if (Math.abs(p.x - r.x) < r.w / 2 + 12 && p.y > r.top + 8) p.x = oldX;
    }
    p.x = Math.max(camX + 24, Math.min(camX + W - 24, Math.max(20, Math.min(WORLD_W - 20, p.x))));
    p.vy += GRAVITY * dt; p.y += p.vy * dt;
    const s = surfaceAt(p.x, prevY);
    if (p.y >= s || (p.onGround && s - p.y < 14 && p.vy >= 0)) {
      if (!p.onGround && p.vy > 250) puff(p.x, s, 12, '#fdba74', 120);
      p.y = s; p.vy = 0; p.onGround = true;
    } else p.onGround = false;
    if (p.dir && p.onGround) {
      p.anim += dt * 10; p.stepT += dt;
      if (p.stepT > .28) { p.stepT = 0; puff(p.x - p.dir * 8, p.y, 3); }
    }
  }
  // astronauts gently keep a little space between them
  for (let i = 0; i < PLAYERS.length; i++) for (let j = i + 1; j < PLAYERS.length; j++) {
    const a = PLAYERS[i], b = PLAYERS[j], d = b.x - a.x;
    if (Math.abs(d) < 36 && Math.abs(a.y - b.y) < 40 && a.dir && a.dir === b.dir) { const push = (36 - Math.abs(d)) * 0.08 * (d >= 0 ? 1 : -1); a.x -= push; b.x += push; }
  }
  const avg = PLAYERS.reduce((a, p) => a + p.x, 0) / PLAYERS.length;
  camX += ((Math.max(0, Math.min(WORLD_W - W, avg - W / 2))) - camX) * Math.min(1, dt * 3);
  for (const q of parts) { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 30 * dt; }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life > parts[i].max) parts.splice(i, 1);
  for (const q of popups) { q.life += dt; q.y -= 40 * dt; }
  for (let i = popups.length - 1; i >= 0; i--) if (popups[i].life > 1.6) popups.splice(i, 1);
  beam = Math.max(0, beam - dt * 2);
}
PLAYERS.forEach((p) => { p.y = ground(p.x); });

/* ---------- Drawing ---------- */
const face = new Image(); face.src = 'control-hydrus-face.png';
const rnd = (i) => { const x = Math.sin(i * 999.1) * 43758.5; return x - Math.floor(x); };

function layer(par, base, amp, f1, col, seed) {    // far hills that move slower (parallax)
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  for (let sx = 0; sx <= W; sx += 16) {
    const wx = sx + camX * par;
    ctx.lineTo(sx, base + amp * Math.sin(wx / f1 + seed) + amp * .5 * Math.sin(wx / (f1 * .37) + seed * 2));
  }
  ctx.lineTo(W, H); ctx.fill();
}

function drawAstro(p) {
  const x = p.x - camX, y = p.y, f = p.face, swing = p.onGround && p.dir ? Math.sin(p.anim) * .6 : (p.onGround ? 0 : .5);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0, 2, 16, 4, 0, 0, 7); ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 9;
  [[-5, swing], [5, -swing]].forEach(([lx, a]) => { ctx.beginPath(); ctx.moveTo(lx, -24); ctx.lineTo(lx + Math.sin(a) * 14, -4 + (1 - Math.cos(a)) * 4); ctx.stroke(); });
  ctx.fillStyle = p.color; [[-5, swing], [5, -swing]].forEach(([lx, a]) => { ctx.fillRect(lx + Math.sin(a) * 14 - 5, -6, 10, 5); });
  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-f * 20 - 6, -54, 12, 26);                       // backpack
  ctx.fillStyle = '#f8fafc'; roundRect(-14, -58, 28, 36, 9); ctx.fill();                  // body
  ctx.fillStyle = p.color; ctx.fillRect(-14, -47, 28, 6);
  ctx.strokeStyle = '#eef2f7'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(f * 10, -50);
  if (p.carry) ctx.lineTo(f * 6, -82); else ctx.lineTo(f * 12 + Math.sin(-swing) * 8, -30); ctx.stroke();
  ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.arc(0, -70, 15, 0, 7); ctx.fill();
  ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#0c2340'; ctx.beginPath(); ctx.ellipse(f * 4, -69, 9, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#7dd3fc'; ctx.beginPath(); ctx.ellipse(f * 1, -72, 3, 2, 0, 0, 7); ctx.fill();
  if (p.carry) {                                                                          // sample over the head
    ctx.shadowColor = '#86efac'; ctx.shadowBlur = 16; ctx.fillStyle = '#c2410c';
    ctx.beginPath(); ctx.ellipse(0, -100, 11, 8, .3, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#86efac'; ctx.font = '10px Orb'; ctx.textAlign = 'center'; ctx.fillText(p.carry, 0, -97);
  }
  ctx.textAlign = 'center'; ctx.font = '13px Exo'; ctx.fillStyle = p.color;               // name tag
  ctx.fillText(`${p.shape} ${p.name}`, 0, p.carry ? -116 : -94);
  if (p.dir) { ctx.fillStyle = p.color; ctx.globalAlpha = .7;                             // walking arrow
    ctx.beginPath(); ctx.moveTo(p.dir * 26, -32); ctx.lineTo(p.dir * 18, -38); ctx.lineTo(p.dir * 18, -26); ctx.fill(); ctx.globalAlpha = 1; }
  const n = nearby(p);
  if (n) {                                                                                // "press your key" prompt
    const ty = p.carry ? -150 : -128, pulse = 1 + .08 * Math.sin(state.time * 8);
    ctx.save(); ctx.translate(0, ty); ctx.scale(pulse, pulse);
    ctx.fillStyle = '#04122bee'; roundRect(-52, -16, 104, 30, 8); ctx.fill(); ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = p.color; roundRect(-48, -12, 22, 22, 4); ctx.fill();
    ctx.fillStyle = '#04122b'; ctx.font = '12px Orb'; ctx.fillText(p.labels[1], -37, 4);
    ctx.fillStyle = '#e0f2fe'; ctx.font = '10px Orb'; ctx.textAlign = 'left'; ctx.fillText(n.label, -20, 4);
    ctx.restore();
  }
  ctx.restore();
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function draw() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2a1208'); g.addColorStop(.55, '#a8461b'); g.addColorStop(1, '#d97706');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fde68a'; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(980 - camX * .03, 150, 22, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.fillStyle = '#e0f2fe'; ctx.beginPath(); ctx.arc(200 - camX * .02, 110, 3, 0, 7); ctx.fill();   // Earth, a blue dot
  ctx.font = '10px Exo'; ctx.fillStyle = '#e0f2fecc'; ctx.fillText('Earth', 190 - camX * .02, 126);
  layer(.15, 380, 30, 260, '#7c2d12', 1);
  layer(.35, 440, 26, 180, '#9a3412', 3);
  // far dust (slow)
  for (let i = 0; i < 40; i++) { const x = ((rnd(i) * 1600 + state.time * 30 - camX * .3) % 1500 + 1500) % 1500 - 100;
    ctx.fillStyle = `rgba(254,215,170,${.06 + rnd(i + 3) * .1})`; ctx.fillRect(x, 120 + rnd(i + 2) * 360, 60 + rnd(i + 1) * 120, 2); }

  // Hydrus Base
  ctx.save(); ctx.translate(-camX, 0);
  ctx.fillStyle = '#e2e8f0'; roundRect(400, 490, 300, 86, 40); ctx.fill();
  ctx.fillStyle = '#0f172a'; roundRect(412, 502, 276, 62, 30); ctx.fill();
  ['#f59e0b', '#a78bfa', '#22c55e', '#38bdf8'].forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = .35; ctx.fillRect(430 + i * 62, 512, 48, 40); ctx.globalAlpha = 1; });
  ctx.fillStyle = '#38bdf8'; roundRect(LAB.x - 20, 506, 40, 64, 10); ctx.fill();
  ctx.fillStyle = '#e0f2fe'; ctx.font = '11px Orb'; ctx.textAlign = 'center'; ctx.fillText('LAB', LAB.x, 498);
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ANTENNA.x, 575); ctx.lineTo(ANTENNA.x, 300); ctx.stroke();
  ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ANTENNA.x + 6, 290, 28, -2.2, .9); ctx.stroke();
  ctx.fillText('ANTENNA', ANTENNA.x, 250);
  if (beam > 0) { ctx.strokeStyle = `rgba(196,181,253,${beam})`; ctx.lineWidth = 4;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(ANTENNA.x + 20, 280, 40 + k * 30 + (1 - beam) * 60, -1.3, -.3); ctx.stroke(); } }
  ctx.restore();

  // ground with relief
  const gg = ctx.createLinearGradient(0, 480, 0, H); gg.addColorStop(0, '#c2410c'); gg.addColorStop(1, '#7c2d12');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, H);
  for (let sx = 0; sx <= W; sx += 8) ctx.lineTo(sx, ground(sx + camX)); ctx.lineTo(W, H); ctx.fill();
  ctx.strokeStyle = '#fdba7455'; ctx.lineWidth = 2; ctx.beginPath();
  for (let sx = 0; sx <= W; sx += 8) ctx.lineTo(sx, ground(sx + camX) + 2); ctx.stroke();
  for (const r of ROCKS) { const x = r.x - camX; if (x < -100 || x > W + 100) continue;
    ctx.fillStyle = '#7c2d12'; ctx.beginPath(); ctx.moveTo(x - r.w / 2, ground(r.x) + 8); ctx.lineTo(x - r.w / 2 + 8, r.top + 6);
    ctx.lineTo(x - 6, r.top - 4); ctx.lineTo(x + r.w / 2 - 6, r.top + 4); ctx.lineTo(x + r.w / 2, ground(r.x) + 8); ctx.fill();
    ctx.fillStyle = '#9a3412'; ctx.beginPath(); ctx.moveTo(x - 6, r.top - 4); ctx.lineTo(x + r.w / 2 - 6, r.top + 4); ctx.lineTo(x + r.w / 2, ground(r.x) + 8); ctx.lineTo(x, ground(r.x) + 8); ctx.fill(); }
  ctx.fillStyle = '#fed7aa'; ctx.font = '12px Orb'; ctx.textAlign = 'center'; ctx.fillText('CRATER', 1850 - camX, ground(1850) + 40);

  // samples
  for (const s of SAMPLES) if (!s.taken) { const x = s.x - camX, y = ground(s.x) - 8, pul = .5 + .5 * Math.sin(state.time * 4);
    ctx.shadowColor = '#86efac'; ctx.shadowBlur = 20 + pul * 15; ctx.fillStyle = '#b45309';
    ctx.beginPath(); ctx.ellipse(x, y, 16, 11, .2, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(134,239,172,${.4 + pul * .5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 26 + pul * 6, 0, 7); ctx.stroke();
    ctx.fillStyle = '#04122bcc'; roundRect(x - 34, y - 52, 68, 22, 6); ctx.fill();
    ctx.fillStyle = '#86efac'; ctx.font = '11px Orb'; ctx.fillText(`SAMPLE ${s.id}`, x, y - 37); }

  PLAYERS.forEach(drawAstro);

  for (const q of parts) { const a = 1 - q.life / q.max; ctx.globalAlpha = a; ctx.fillStyle = q.col;
    if (q.glow) { ctx.shadowColor = q.col; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.arc(q.x - camX, q.y, q.size * (q.glow ? 1 : (1 + q.life)), 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
  ctx.globalAlpha = 1;
  for (const q of popups) { ctx.globalAlpha = Math.min(1, 2 - q.life); ctx.fillStyle = q.col; ctx.font = '22px Orb';
    ctx.textAlign = 'center'; ctx.fillText(q.text, q.x - camX, q.y); }
  ctx.globalAlpha = 1;
  // near dust (fast, in front)
  for (let i = 0; i < 22; i++) { const x = ((rnd(i + 50) * 1700 + state.time * 140 - camX * 1.3) % 1600 + 1600) % 1600 - 160;
    ctx.fillStyle = `rgba(255,237,213,${.05 + rnd(i + 9) * .12})`; ctx.fillRect(x, 100 + rnd(i + 7) * 560, 90 + rnd(i + 4) * 160, 3); }

  hud();
}

function hud() {
  ctx.fillStyle = '#04122bdd'; ctx.fillRect(0, 0, W, 46);
  ctx.fillStyle = '#7dd3fc'; ctx.font = '15px Orb'; ctx.textAlign = 'left'; ctx.fillText('MARS · JEZERO CRATER · DAY 2', 20, 29);
  const m = Math.floor(state.clock / 60), s = Math.floor(state.clock % 60);
  ctx.textAlign = 'right'; ctx.fillStyle = state.clock < 20 ? '#fca5a5' : '#e0f2fe';
  ctx.fillText(`SUNSET IN ${m}:${String(s).padStart(2, '0')}   ·   DATA SENT ${state.sent}/${state.goal}   ·   WAITING ${state.pending}`, W - 20, 29);
  // Control Hydrus line
  const a = Math.min(1, (state.time - state.msgT) * 3);
  ctx.globalAlpha = a; ctx.fillStyle = '#f0f9ffee'; roundRect(16, 58, 700, 64, 14); ctx.fill();
  ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 3; ctx.stroke();
  if (face.complete) { ctx.save(); ctx.beginPath(); ctx.arc(50, 90, 24, 0, 7); ctx.clip(); ctx.drawImage(face, 26, 66, 48, 48); ctx.restore(); }
  ctx.fillStyle = '#0369a1'; ctx.font = '10px Orb'; ctx.textAlign = 'left'; ctx.fillText('CONTROL HYDRUS', 86, 76);
  ctx.fillStyle = '#0c2340'; ctx.font = '15px Exo';
  const text = state.msg.slice(0, Math.floor((state.time - state.msgT) * 60));
  wrap(text, 86, 95, 610, 18);
  ctx.globalAlpha = 1;
  // player key bar
  PLAYERS.forEach((p, i) => {
    const x = 16 + i * 316, y = H - 54;
    ctx.fillStyle = '#04122bdd'; roundRect(x, y, 304, 44, 10); ctx.fill();
    ctx.strokeStyle = p.color + '88'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = p.color; ctx.font = '15px Exo'; ctx.textAlign = 'left'; ctx.fillText(`${p.shape} ${p.name}`, x + 12, y + 27);
    p.labels.forEach((l, k) => { const on = state.time - p.pressed[k] < .18, kx = x + 170 + k * 42;
      ctx.fillStyle = on ? p.color : 'transparent'; roundRect(kx, y + 8, 34, 28, 6); ctx.fill();
      ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = on ? '#04122b' : p.color; ctx.font = '13px Orb'; ctx.textAlign = 'center'; ctx.fillText(l, kx + 17, y + 27); });
  });
}
function wrap(t, x, y, maxW, lh) {
  const words = t.split(' '); let line = '';
  for (const w of words) { const test = line + w + ' ';
    if (ctx.measureText(test).width > maxW) { ctx.fillText(line, x, y); line = w + ' '; y += lh; } else line = test; }
  ctx.fillText(line, x, y);
}

/* ---------- Game loop ---------- */
const DT = 1 / 60;
let acc = 0, last = performance.now();
function loop(now) {
  acc += Math.min(.1, (now - last) / 1000); last = now;
  while (acc >= DT) { step(DT); acc -= DT; }
  draw(); requestAnimationFrame(loop);
}
if (!location.search.includes('record')) requestAnimationFrame(loop);

/* ---------- Recording helper: advance the game to time t and draw ---------- */
window.simulate = (t, bots) => { while (state.time < t) { if (bots) bots(); step(DT); } draw(); };
window.GAME = { PLAYERS, SAMPLES, ROCKS, LAB, ANTENNA, state, press, nearby };
