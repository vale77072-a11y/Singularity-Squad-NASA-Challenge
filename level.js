/* =====================================================
   HYDRUS 2040 — PLANET LEVEL
   The crew walks by itself (spectator). When an event happens,
   a JRPG-style transition opens the helmet view (first person),
   where the team decides, plays a minigame, or both.
   All the content comes from js/missions/<planet>.js
   ===================================================== */

const LV = {};
const qtyItem = (id) => GAME.items[id] || 0;

/* ---------- start ---------- */
function levelEnter() {
  const m = mission();
  const c = calculate();                      // hangar numbers (power, science, etc.)
  Object.assign(LV, {
    m, step: -1, phase: 'walk', t: 0, last: performance.now(), raf: 0,
    inv: { hull: 100, energy: c.powerOk ? 100 : 70, o2: 5, kits: qtyItem('repair'), data: 0 },
    dataPerSample: c.dataPerSample, samples: 0, goal: false, log: [], facts: [],
    fact: null, factT: -99, walkDist: 0, say: '', sayT: 0, popup: null, ended: false
  });
  $('#level-stage').innerHTML = `
    <div class="lv-walk" id="lv-walk"><div class="lv-walkbg" id="lv-walkbg" style="background-image:url(${m.walkImage})"></div>
      <svg class="lv-full" id="lv-crew" viewBox="0 0 1920 1080"></svg></div>
    <div class="lv-pov hidden" id="lv-pov"><div class="lv-povbg" id="lv-povbg" style="background-image:url(${m.povImage})"></div>
      <svg class="lv-full" id="lv-visor" viewBox="0 0 1920 1080"></svg><div class="lv-full" id="lv-povui"></div></div>
    <div class="lv-full" id="lv-hud"></div>
    <svg class="lv-full lv-trans" id="lv-trans" viewBox="0 0 1920 1080"></svg>`;
  nextStep();
  cancelAnimationFrame(LV.raf); LV.raf = requestAnimationFrame(levelLoop);
}

function nextStep() {
  LV.step++;
  const s = LV.m.steps[LV.step];
  if (!s) return finishLevel();
  LV.t = 0;
  if (s.type === 'walk') { LV.phase = 'walk'; sayLine(s.line); showPov(false); }
  else { LV.phase = 'trans-in'; LV.ev = { s, sub: 'intro', votes: {}, t: 0, lastVote: 0, result: null }; }
}

function sayLine(text) { LV.say = text; LV.sayT = LV.t; }

/* ---------- effects on supplies ---------- */
function applyEffects(fx = {}) {
  const inv = LV.inv;
  if (fx.hull) inv.hull += fx.hull < 0 && qtyItem('shield') ? Math.round(fx.hull / 2) : fx.hull;   // the shield halves damage
  if (fx.energy) inv.energy += fx.energy;
  if (fx.o2) inv.o2 += fx.o2;
  if (fx.kits) inv.kits += fx.kits;
  if (fx.data) inv.data += fx.data;
  inv.hull = Math.max(0, Math.min(100, inv.hull)); inv.energy = Math.max(0, Math.min(100, inv.energy));
  inv.o2 = Math.max(0, inv.o2); inv.kits = Math.max(0, inv.kits); inv.data = Math.max(0, inv.data);
}
function failed() {
  const i = LV.inv;
  if (i.hull <= 0) return 'The suits were too damaged to continue.';
  if (i.energy <= 0) return 'The crew ran out of energy.';
  if (i.o2 <= 0) return 'The crew ran out of oxygen tanks.';
  return null;
}

/* ---------- main loop ---------- */
function levelLoop(now) {
  if (currentScreen !== 'level' || LV.ended) return;
  const dt = Math.min(.1, (now - LV.last) / 1000); LV.last = now;
  LV.t += dt;
  const s = LV.m.steps[LV.step];

  if (LV.phase === 'walk') {
    LV.walkDist += dt * 95 * (LV.fast ? 3 : 1);
    if (LV.t >= s.seconds / (LV.fast ? 3 : 1)) {
      LV.fast = false;
      LV.inv.energy = Math.max(0, LV.inv.energy - LV.m.energyPerWalk);
      if (s.sample) { LV.samples++; LV.inv.data += LV.dataPerSample; LV.popup = { text: `${s.sample}  +${LV.dataPerSample} DATA`, t: LV.t }; }
      const why = failed(); if (why) return endMission(false, why);
      LV.phase = 'walk-wait'; LV.t = 0;
    }
    drawWalk(true);
  } else if (LV.phase === 'walk-wait') {
    drawWalk(false);
    if (LV.t > (LV.popup ? 1.6 : .3)) { LV.popup = null; nextStep(); }
  } else if (LV.phase === 'trans-in') {
    drawTrans(LV.t / 1.2); drawWalk(false);
    if (LV.t > .6) { showPov(true); updateEvent(dt); }
    if (LV.t >= 1.2) { LV.phase = 'event'; LV.t = 0; $('#lv-trans').innerHTML = ''; }
  } else if (LV.phase === 'event') {
    updateEvent(dt);
  } else if (LV.phase === 'trans-out') {
    const k = LV.t / .8;
    $('#lv-trans').innerHTML = `<rect width="1920" height="1080" fill="#000" opacity="${1 - Math.abs(k * 2 - 1)}"/>`;
    if (k > .5) showPov(false);
    if (k >= 1) { $('#lv-trans').innerHTML = ''; nextStep(); }
    else drawWalk(false);
  }
  drawHud();
  LV.raf = requestAnimationFrame(levelLoop);
}

function showPov(on) {
  $('#lv-pov').classList.toggle('hidden', !on);
  $('#lv-walk').classList.toggle('hidden', on);
}

/* ---------- walking scene (spectator) ---------- */
function groundY(x) { return 850 - 25 * Math.sin(x / 300) - 12 * Math.sin(x / 97); }
function walker(x, y, i, ph) {
  const c = PLAYER_STYLE[i].color, sw = Math.sin(ph) * .55;
  return `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="3" rx="26" ry="6" fill="#000" opacity=".3"/>
    <g stroke="#e7ecf2" stroke-width="15" stroke-linecap="round"><line x1="-8" y1="-42" x2="${-8 + Math.sin(sw) * 22}" y2="-6"/><line x1="8" y1="-42" x2="${8 + Math.sin(-sw) * 22}" y2="-6"/></g>
    <rect x="${-17 + Math.sin(sw) * 22}" y="-12" width="18" height="10" rx="4" fill="${c}"/><rect x="${-1 + Math.sin(-sw) * 22}" y="-12" width="18" height="10" rx="4" fill="${c}"/>
    <rect x="-36" y="-98" width="20" height="50" rx="6" fill="#b8c2cf"/><rect x="-24" y="-100" width="48" height="62" rx="16" fill="#f4f6f9"/><rect x="-24" y="-82" width="48" height="8" fill="${c}"/>
    <text x="0" y="-52" font-size="16" text-anchor="middle" fill="${c}">${PLAYER_STYLE[i].shape}</text>
    <line x1="18" y1="-90" x2="${18 + Math.sin(-sw) * 16}" y2="-54" stroke="#e7ecf2" stroke-width="12" stroke-linecap="round"/>
    <circle cx="2" cy="-122" r="27" fill="#f4f6f9"/><circle cx="2" cy="-122" r="27" fill="none" stroke="${c}" stroke-width="4"/>
    <ellipse cx="9" cy="-120" rx="18" ry="13" fill="#7c4a23"/><ellipse cx="3" cy="-126" rx="6" ry="3" fill="#fde7c4" opacity=".7"/>
    <text x="0" y="-162" font-size="20" text-anchor="middle" fill="${c}" style="paint-order:stroke" stroke="#0009" stroke-width="5">${PLAYER_STYLE[i].shape} ${esc(GAME.players[i])}</text></g>`;
}
function drawWalk(moving) {
  const off = LV.walkDist % 7680, n = GAME.players.length;
  $('#lv-walkbg').style.transform = `translateX(${-off}px)`;
  let s = '';
  for (let i = 0; i < n; i++) {
    const sx = 760 + (i - (n - 1) / 2) * 130, ph = LV.walkDist / 14 + i * 1.3;
    s += walker(sx, groundY(sx + off) + 8, i, moving ? ph : 0);
  }
  if (moving) for (let i = 0; i < 8; i++) { const a = (LV.walkDist / 120 + i * .13) % 1, px = 600 + i * 70;
    s += `<ellipse cx="${px - a * 40}" cy="${groundY(px + off) - 4 - a * 20}" rx="${8 + a * 20}" ry="${4 + a * 8}" fill="#e2b48a" opacity="${(1 - a) * .3}"/>`; }
  $('#lv-crew').innerHTML = s;
}

/* ---------- JRPG transition: spiral of black blocks ---------- */
const SPIRAL = (() => { const cols = 16, rows = 9, o = []; let x = 0, y = 0, dx = 1, dy = 0, l = 0, r = cols - 1, tp = 0, b = rows - 1;
  while (o.length < cols * rows) { o.push([x, y]); if (dx === 1 && x === r) { dx = 0; dy = 1; tp++; } else if (dy === 1 && y === b) { dy = 0; dx = -1; r--; } else if (dx === -1 && x === l) { dx = 0; dy = -1; b--; } else if (dy === -1 && y === tp) { dy = 0; dx = 1; l++; } x += dx; y += dy; }
  return o; })();
function drawTrans(p) {
  let s = p < .12 ? `<rect width="1920" height="1080" fill="#fff" opacity="${1 - p / .12}"/>` : '';
  const n = Math.floor(Math.min(1, Math.max(0, (p - .05) / .5)) * SPIRAL.length), m = Math.floor(Math.min(1, Math.max(0, (p - .55) / .45)) * SPIRAL.length);
  SPIRAL.forEach(([x, y], i) => { if (i < n && i >= m) s += `<rect x="${x * 120}" y="${y * 120}" width="121" height="121" fill="#000"/>`; });
  $('#lv-trans').innerHTML = s;
}

/* ---------- helmet visor ---------- */
function drawVisor(col) {
  const bob = Math.sin(performance.now() / 500) * 4;
  $('#lv-povbg').style.transform = `translate(${Math.sin(performance.now() / 1400) * 12}px, ${bob}px) scale(1.06)`;
  $('#lv-visor').innerHTML = `<defs><radialGradient id="vrim" cx=".5" cy=".5" r=".75"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></radialGradient>
    <linearGradient id="vshell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3f47"/><stop offset=".5" stop-color="#1c2027"/><stop offset="1" stop-color="#0b0d11"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="url(#vrim)"/>
    <path fill-rule="evenodd" fill="url(#vshell)" d="M0 0H1920V1080H0Z M960 ${150 + bob} C1460 ${150 + bob} 1800 330 1800 560 C1800 800 1500 ${990 + bob} 960 ${990 + bob} C420 ${990 + bob} 120 800 120 560 C120 330 460 ${150 + bob} 960 ${150 + bob}Z"/>
    <path fill="none" stroke="${col}" stroke-width="4" opacity=".75" d="M960 ${158 + bob} C1452 ${158 + bob} 1790 334 1790 560 C1790 796 1494 ${982 + bob} 960 ${982 + bob} C426 ${982 + bob} 130 796 130 560 C130 334 468 ${158 + bob} 960 ${158 + bob}Z"/>
    <path d="M300 300 C420 230 560 200 700 190 L640 230 C520 245 410 280 330 330Z" fill="#fff" opacity=".07"/>
    <path d="M1500 760 C1560 700 1600 640 1630 560 L1650 580 C1620 680 1580 740 1520 790Z" fill="#fff" opacity=".05"/>
    ${[[420, 700, 520, 660], [1350, 300, 1420, 280], [600, 860, 640, 830], [1500, 420, 1530, 470]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#fff" stroke-width="1.5" opacity=".18"/>`).join('')}
    <text x="960" y="${1035 + bob}" font-family="Orbitron" font-size="16" fill="${col}" text-anchor="middle" letter-spacing="6" opacity=".8">LIFE SUPPORT · SUIT HUD</text>`;
}

/* ---------- events ---------- */
function optionLocked(o) {
  return (o.needs && !qtyItem(o.needs)) || (o.needsKit && LV.inv.kits <= 0);
}
function lockReason(o) {
  if (o.needs) return 'Needs: ' + EQUIPMENT.find((e) => e.id === o.needs).name;
  if (o.needsKit) return 'No repair kits left';
  return '';
}
function startMinigame(ev) {
  const s = ev.s;
  ev.sub = 'play'; ev.t = 0; ev.player = stationPlayer(s.station);
  ev.seq = Array.from({ length: s.length || 5 }, () => Math.floor(Math.random() * 3));
  ev.pos = 0; ev.errors = 0; ev.hits = 0; ev.misses = 0; ev.progress = 0; ev.holding = false; ev.flash = -9;
}
function resolveEvent(ev, text, fx) {
  applyEffects(fx);
  ev.sub = 'result'; ev.t = 0; ev.result = text;
  LV.log.push({ title: ev.s.alert, text });
}
function updateEvent(dt) {
  const ev = LV.ev, s = ev.s; ev.t += dt;
  // decision / mixed votes end when everyone voted (or time runs out)
  if (ev.sub === 'intro') { ev.sub = s.kind === 'minigame' ? 'brief' : 'vote'; ev.t = 0; }
  if (ev.sub === 'brief' && ev.t > 2.2) startMinigame(ev);
  if (ev.sub === 'vote') {
    const n = GAME.players.length, voted = Object.keys(ev.votes).length;
    if (s.kind === 'mixed' && LV.inv.kits <= 0 && ev.t > 2) { ev.choice = 1; startMinigame(ev); }
    else if ((voted >= n && ev.t > ev.lastVote + 1) || ev.t > 20) decideVote(ev);
  }
  if (ev.sub === 'play') updateMinigame(ev, dt);
  if (ev.sub === 'result' && ev.t > 3.6) {
    if (s.nasa) { LV.fact = s.nasa; LV.factT = performance.now() + 800; LV.facts.push(s.nasa); }
    const why = failed(); if (why) return endMission(false, why);
    LV.phase = 'trans-out'; LV.t = 0;
  }
  drawEvent();
}
function decideVote(ev) {
  const s = ev.s, opts = s.kind === 'mixed' ? [s.safe, s.risky] : s.options;
  const count = opts.map((_, i) => Object.values(ev.votes).filter((v) => v === i).length);
  let best = -1;
  opts.forEach((o, i) => { if (optionLocked(o)) return; if (best < 0 || count[i] > count[best]) best = i; });
  if (Object.keys(ev.votes).length === 0) {          // nobody voted: pick the safe default
    const def = s.kind === 'mixed' ? 0 : 1;
    if (opts[def] && !optionLocked(opts[def])) best = def;
  }
  ev.choice = best;
  if (s.kind === 'mixed') {
    if (best === 0) resolveEvent(ev, s.safe.result, s.safe.effects); else startMinigame(ev);
  } else resolveEvent(ev, opts[best].result, opts[best].effects);
}
function winMinigame(ev, won) {
  const s = ev.s, r = won ? s.win : s.lose, fx = { ...(r.effects || {}) };
  if (s.goal) {
    const full = qtyItem('lab') ? 30 : qtyItem('camera') ? 12 : 6;
    fx.data = (fx.data || 0) + (won ? full : Math.round(full / 2));
    LV.goal = won;
  }
  resolveEvent(ev, r.result + (fx.data ? `  (+${fx.data} data)` : ''), fx);
}
function updateMinigame(ev, dt) {
  const s = ev.s, left = s.seconds - ev.t;
  if (s.game === 'timing') ev.marker = 50 + 45 * Math.sin(ev.t * 2.2);
  if (s.game === 'hold') {
    ev.progress = ev.holding ? ev.progress + dt / s.holdSeconds : Math.max(0, ev.progress - dt * .25);
    if (ev.progress >= 1) return winMinigame(ev, true);
  }
  if (left <= 0) winMinigame(ev, false);
}
function levelKey(i, k, down) {
  if (currentScreen !== 'level') return;
  if (LV.phase === 'walk' && down && k === 1 && !nasaShowing()) { LV.fast = true; return; }   // middle key: walk faster (not while a NASA file is open)
  if (LV.phase !== 'event' || !LV.ev) return;
  const ev = LV.ev, s = ev.s;
  if (ev.sub === 'vote' && down) {
    const opts = s.kind === 'mixed' ? [s.safe, s.risky] : s.options;
    const pick = s.kind === 'mixed' ? (k === 0 ? 0 : k === 2 ? 1 : -1) : k;
    if (pick < 0 || !opts[pick] || optionLocked(opts[pick])) return;
    ev.votes[i] = pick; ev.lastVote = ev.t; ev.flashKey = { i, k, t: ev.t };
  }
  if (ev.sub === 'play' && i === ev.player) {
    if (s.game === 'hold' && k === 1) ev.holding = down;
    if (!down) return;
    ev.flashKey = { i, k, t: ev.t };
    if (s.game === 'sequence') {
      if (k === ev.seq[ev.pos]) { ev.pos++; if (ev.pos >= ev.seq.length) winMinigame(ev, true); }
      else { ev.errors++; ev.flash = ev.t; if (ev.errors >= 3) winMinigame(ev, false); }
    }
    if (s.game === 'timing' && k === 1) {
      if (Math.abs(ev.marker - 50) < 7) { ev.hits++; if (ev.hits >= (s.hits || 3)) winMinigame(ev, true); }
      else { ev.misses++; ev.flash = ev.t; if (ev.misses >= 3) winMinigame(ev, false); }
    }
  }
}

/* ---------- event screen (inside the helmet) ---------- */
function invBox() {
  const v = LV.inv;
  return `<div class="ev-inv"><h4>CREW SUPPLIES</h4>
    <div class="r"><span>O₂ tanks</span><b>${v.o2}/5</b></div><div class="r"><span>Repair kits</span><b>${v.kits}</b></div>
    <div class="r"><span>Suit integrity</span><b>${v.hull}%</b></div><div class="bar"><i style="width:${v.hull}%;background:linear-gradient(90deg,#0ea5e9,#38bdf8)"></i></div>
    <div class="r"><span>Energy</span><b>${v.energy}%</b></div><div class="bar"><i style="width:${v.energy}%;background:linear-gradient(90deg,#0ea5e9,#4ade80)"></i></div>
    <div class="r"><span>Data</span><b>${v.data} pts</b></div></div>`;
}
function keysBar(litPlayer, litKey) {
  return `<div class="ev-keys">${GAME.players.map((name, i) => { const c = PLAYER_STYLE[i].color, on = i === litPlayer;
    return `<div class="k" style="${on ? `border:2px solid ${c};box-shadow:0 0 18px ${c}88` : ''}"><span class="s" style="color:${c}">${PLAYER_STYLE[i].shape}</span>
      <div><b>${esc(name)}</b><small>${STATIONS.filter((_, k) => k % GAME.players.length === i).map((st) => st.name).join(' · ')}</small></div>
      <div class="kb">${KEY_LABELS[i].map((l, j) => `<i style="border-color:${c};${on && j === litKey ? `background:${c};color:#04122b` : `color:${c}`}">${l}</i>`).join('')}</div></div>`; }).join('')}</div>`;
}
function evSay(text, t) {
  return `<div class="jr-say ev-say"><img src="assets/images/control-hydrus-face.png" alt=""><div><b>CONTROL HYDRUS</b><p>${text.slice(0, Math.floor(t * 50))}</p></div></div>`;
}
function drawEvent() {
  const ev = LV.ev, s = ev.s, n = GAME.players.length;
  const p = ev.player, col = (ev.sub === 'play' || ev.sub === 'brief') && p !== undefined ? PLAYER_STYLE[p].color
    : ev.sub === 'brief' ? PLAYER_STYLE[stationPlayer(s.station)].color : '#7dd3fc';
  drawVisor(ev.sub === 'brief' ? PLAYER_STYLE[stationPlayer(s.station)].color : col);
  const fk = ev.flashKey && ev.t - ev.flashKey.t < .2 ? ev.flashKey : null;
  let h = `<div class="ev-alert">⚠ ${s.alert} · ${s.kind.toUpperCase()}</div>` + invBox();

  if (ev.sub === 'vote') {
    const opts = s.kind === 'mixed' ? [s.safe, s.risky] : s.options;
    const keyName = (i) => s.kind === 'mixed' ? (i === 0 ? 'LEFT' : 'RIGHT') : ['LEFT', 'MIDDLE', 'RIGHT'][i];
    h += `<div class="ev-who"><b>TEAM VOTE</b><small>${s.kind === 'mixed' ? 'Left key = use a kit · Right key = minigame' : 'Left key = 1 · Middle key = 2 · Right key = 3'}<br>Votes: ${Object.keys(ev.votes).length}/${n} · ${Math.max(0, Math.ceil(20 - ev.t))} s</small></div>`;
    h += `<div class="ev-opts">${opts.map((o, i) => { const lock = optionLocked(o), voters = Object.entries(ev.votes).filter(([, v]) => v === i).map(([pi]) => +pi);
      return `<div class="ev-opt ${lock ? 'locked' : ''}"><span class="key">${keyName(i)}</span><b>${o.label}</b><p>${o.text}</p>
        <div class="fx">${lock ? lockReason(o) : fxText(o.effects, s.kind === 'mixed' && i === 1)}</div>
        <div class="votes">${voters.map((pi) => `<i style="color:${PLAYER_STYLE[pi].color}">${PLAYER_STYLE[pi].shape}</i>`).join('')}</div></div>`; }).join('')}</div>`;
    h += evSay(s.say, ev.t);
  }
  if (ev.sub === 'brief') {
    const pi = stationPlayer(s.station), c = PLAYER_STYLE[pi].color;
    h += `<div class="ev-who" style="border-color:${c}"><b style="color:${c}">${PLAYER_STYLE[pi].shape} ${esc(GAME.players[pi]).toUpperCase()} · ${s.station.toUpperCase()}</b><small>You are wearing ${esc(GAME.players[pi])}'s helmet. Get ready!</small></div>`;
    h += evSay(`${esc(GAME.players[pi])}! ${s.say}`, ev.t);
  }
  if (ev.sub === 'play') {
    const c = PLAYER_STYLE[p].color, L = KEY_LABELS[p], left = Math.max(0, s.seconds - ev.t), err = ev.t - ev.flash < .3;
    h += `<div class="ev-who" style="border-color:${c}"><b style="color:${c}">${PLAYER_STYLE[p].shape} ${esc(GAME.players[p]).toUpperCase()} · ${s.station.toUpperCase()}</b><small>Only ${esc(GAME.players[p])} plays.</small></div>`;
    h += `<div class="ev-mg ${err ? 'err' : ''}" style="border-color:${c}">`;
    if (s.game === 'sequence') h += `<h3 style="color:${c}">PRESS IN ORDER · errors ${ev.errors}/3</h3><div class="seq">${ev.seq.map((k, j) => `<i style="border-color:${c};${j < ev.pos ? `background:${c};color:#04122b` : `color:${c}`}">${L[k]}</i>`).join('')}</div>`;
    if (s.game === 'timing') h += `<h3 style="color:${c}">PRESS ${L[1]} IN THE GREEN ZONE · misses ${ev.misses}/3</h3><div class="track"><div class="zone"></div><div class="mk" style="left:calc(${ev.marker}% - 4px)"></div></div>
      <div class="hits">${Array.from({ length: s.hits || 3 }, (_, j) => `<i class="${j < ev.hits ? 'on' : ''}">${j < ev.hits ? '✓' : ''}</i>`).join('')}</div>`;
    if (s.game === 'hold') h += `<h3 style="color:${c}">HOLD ${L[1]} · DON'T LET GO</h3><div class="track"><div class="fill" style="width:${ev.progress * 100}%;background:${c}"></div></div>`;
    h += `<div class="time"><i style="width:${left / s.seconds * 100}%"></i></div><small class="tl">${left.toFixed(1)} s</small></div>`;
  }
  if (ev.sub === 'result') {
    const good = !/lost|damage|battered|drained|slipped|scratched/i.test(ev.result);
    h += `<div class="ev-res ${good ? 'good' : 'bad'}">${ev.result}</div>`;
  }
  h += keysBar(fk ? fk.i : (ev.sub === 'play' ? p : -1), fk ? fk.k : -1);
  $('#lv-povui').innerHTML = h;
}
function fxText(fx = {}, risky) {
  if (risky) return 'Free if you win · risk if you fail';
  const names = { hull: 'suit', energy: 'energy', o2: 'O₂ tank', kits: 'repair kit', data: 'data' };
  return Object.entries(fx).map(([k, v]) => `${v > 0 ? '+' : '−'}${Math.abs(v)}${k === 'hull' || k === 'energy' ? '%' : ''} ${names[k]}`).join(' · ') || 'No cost';
}

/* ---------- HUD (top bar + Control Hydrus + NASA file) ---------- */
function drawHud() {
  const v = LV.inv, m = LV.m, events = m.steps.filter((x) => x.type === 'event').length,
    done = m.steps.slice(0, LV.step).filter((x) => x.type === 'event').length;
  let h = '';
  if (LV.phase.startsWith('walk')) {
    h += `<div class="lv-top"><div><h1>${m.name} · ${m.place.toUpperCase()}</h1><small>${m.title} · Event ${Math.min(done + 1, events)} of ${events}</small></div>
      <div class="lv-stats"><span>O₂ <b>${v.o2}/5</b></span><span>KITS <b>${v.kits}</b></span><span>SUIT <b>${v.hull}%</b></span><span>ENERGY <b>${v.energy}%</b></span><span>DATA <b>${v.data}</b></span></div></div>
      <div class="lv-cam">● SPECTATOR · THE CREW IS WALKING <small>(middle key: walk faster)</small></div>`;
    if (LV.say) h += `<div class="jr-say lv-say"><img src="assets/images/control-hydrus-face.png" alt=""><div><b>CONTROL HYDRUS</b><p>${LV.say.slice(0, LV.phase === 'walk' ? Math.floor((LV.t - LV.sayT) * 50) : 999)}</p></div></div>`;
    if (LV.popup) h += `<div class="lv-pop">${LV.popup.text}</div>`;
  }
  // NASA file: top-left, 10 seconds
  const ft = (performance.now() - LV.factT) / 1000;
  if (LV.fact && ft < 10 && LV.phase.startsWith('walk')) {
    h += `<div class="lv-nasa" style="opacity:${Math.min(1, ft * 4, (10 - ft) * 2)}"><div class="st"><img src="assets/images/control-hydrus-face.png" alt=""><b>NASA FILE · THIS REALLY HAPPENED</b></div>
      <p>${LV.fact.text}</p><div class="tb"><i style="width:${(10 - ft) * 10}%"></i></div><small>Source: ${LV.fact.source} · ${Math.ceil(10 - ft)} s</small></div>`;
  }
  $('#lv-hud').innerHTML = h;
}

function nasaShowing() { return LV.fact && (performance.now() - LV.factT) / 1000 < 10; }

/* ---------- end ---------- */
function finishLevel() { endMission(true, null); }
function endMission(survived, why) {
  LV.ended = true;
  const c = calculate();
  const antenna = qtyItem('antenna') > 0;
  GAME.report = { survived, why, goal: LV.goal && survived, inv: { ...LV.inv }, samples: LV.samples,
    dataSent: Math.round(LV.inv.data * (antenna ? 1 : .6)), antenna, log: LV.log, facts: LV.facts, c };
  showScreen('report');
}
SCREENS.level = { enter: levelEnter, key: levelKey };

/* =====================================================
   10. FINAL REPORT: the 6 resources of the challenge
   ===================================================== */
function reportEnter() {
  const R = GAME.report, m = mission(), c = R.c, r = c.r;
  const win = R.goal;
  const title = win ? m.winTitle : R.survived ? 'Mission complete' : 'Mission failed';
  const story = win ? m.winText : R.survived ? m.loseText : R.why + ' ' + m.loseText;
  const row = (k, v, note) => `<div class="rp-res"><small>${k}</small><b>${v}</b><span>${note}</span></div>`;
  $('#report-stage').innerHTML = `
    <div class="jr-bg"></div>
    <div class="rp-wrap">
      <p class="rp-kicker">HYDRUS 2040 · ${m.name}: ${m.title.toUpperCase()}</p>
      <h1 class="${win ? 'win' : R.survived ? '' : 'lose'}">${title.toUpperCase()}</h1>
      <p class="rp-crew">${GAME.players.map((n, i) => `<span style="color:${PLAYER_STYLE[i].color}">${PLAYER_STYLE[i].shape} ${esc(n)}</span>`).join(' · ')}</p>
      <p class="rp-story">${story}</p>
      <div class="rp-grid">
        ${row('MASS', `${c.weight} / ${r.payload} kg`, `${r.name} rocket`)}
        ${row('BUDGET', `$${c.cost}M / $${BUDGET}M`, `$${BUDGET - c.cost}M left`)}
        ${row('POWER', `${R.inv.energy}%`, 'energy left at the end')}
        ${row('DATA', `${R.dataSent} pts`, `${R.samples} samples · ${R.goal ? 'goal reached' : 'goal missed'}`)}
        ${row('COMMUNICATIONS', R.antenna ? 'High-gain antenna' : 'No antenna', R.antenna ? 'all data reached Earth' : 'only 60% of the data reached Earth')}
        ${row('TIME', `${TRAVEL_DAYS[GAME.rocket]} + ${r.days} days`, 'travel + exploration')}
      </div>
      <div class="rp-cols">
        <div><h3>WHAT HAPPENED</h3>${R.log.map((l) => `<p><b>${l.title}:</b> ${l.text}</p>`).join('') || '<p>No events.</p>'}</div>
        <div><h3>REAL NASA EVENTS BEHIND YOUR MISSION</h3>${R.facts.map((f) => `<p>${f.text} <a href="${f.url}" target="_blank" rel="noopener">${f.source}</a></p>`).join('') || '<p>—</p>'}
          <p class="rp-real">${m.realMission}</p></div>
      </div>
      <div class="rp-btns"><button class="btn" id="rp-menu">MENU</button><button class="btn btn-main" id="rp-again">PLAY AGAIN ▸</button></div>
    </div>`;
  $('#rp-menu').addEventListener('click', () => showScreen('title'));
  $('#rp-again').addEventListener('click', () => showScreen('hangar'));
}
SCREENS.report = { enter: reportEnter };
