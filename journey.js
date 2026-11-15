/* =====================================================
   HYDRUS 2040 — JOURNEY: launch countdown, trajectory,
   mission map and animation slots
   ===================================================== */

const mission = () => MISSIONS[GAME.destination.id];
const hydrusSays = (text, extra = '') =>
  `<div class="jr-say" ${extra}><img src="assets/images/control-hydrus-face.png" alt=""><div><b>CONTROL HYDRUS</b><p>${text}</p></div></div>`;

/* =====================================================
   5. LAUNCH: GO poll + countdown + liftoff
   ===================================================== */
const LN = { phase: 'poll', go: [], t0: 0, raf: 0 };

function launchEnter() {
  const n = GAME.players.length;
  LN.phase = 'poll'; LN.go = Array(n).fill(false); LN.t0 = performance.now();
  $('#launch-stage').innerHTML = `
    <div class="ln-bg"></div>
    <video class="ln-video hidden" id="ln-video" muted playsinline preload="auto"></video>
    <div class="ln-shade"></div>
    <div class="ln-top"><h1>LAUNCH SEQUENCE · HYDRUS 2040 → ${GAME.destination.name}</h1>
      <small>${ROCKETS.find((r) => r.id === GAME.rocket).name} rocket · Fuel ${GAME.fuel}% · Crew of ${n}</small></div>
    <div class="ln-count"><small id="ln-label">GO / NO-GO POLL</small><b id="ln-num">--</b><span id="ln-event"></span></div>
    <div class="ln-poll" id="ln-poll">${GAME.players.map((name, i) => `
      <div class="ln-seat" id="ln-seat-${i}" style="--c:${PLAYER_STYLE[i].color}">
        <span class="sh">${PLAYER_STYLE[i].shape}</span><div><b>${esc(name)}</b><small>Press <i>${KEY_LABELS[i][1]}</i> for GO</small></div>
        <span class="st" id="ln-st-${i}">GO?</span></div>`).join('')}</div>
    <div class="ln-tel hidden" id="ln-tel"></div>
    <div class="ln-big hidden" id="ln-big">LIFTOFF!</div>
    <div id="ln-say">${hydrusSays('All stations, this is Control Hydrus. Give me a GO for launch: press your middle key!')}</div>
    <button class="btn btn-small ln-skip" id="ln-skip">Skip ▸▸</button>`;
  const v = $('#ln-video');
  v.addEventListener('loadeddata', () => v.classList.remove('hidden'));
  v.addEventListener('error', () => v.classList.add('hidden'));
  if (LAUNCH_VIDEO) v.src = LAUNCH_VIDEO;
  $('#ln-skip').addEventListener('click', () => showScreen('trajectory'));
  cancelAnimationFrame(LN.raf); LN.raf = requestAnimationFrame(launchLoop);
}

function launchKey(i, k, down) {
  if (!down || LN.phase !== 'poll' || k !== 1 || LN.go[i]) return;
  LN.go[i] = true;
  $('#ln-seat-' + i).classList.add('go'); $('#ln-st-' + i).textContent = '✓ GO';
  if (LN.go.every(Boolean)) {
    LN.phase = 'count'; LN.t0 = performance.now();
    $('#ln-say').innerHTML = hydrusSays('GO from every station. Hold on tight, crew. Here we go!');
  }
}

function launchLoop(now) {
  if (currentScreen !== 'launch') return;
  const t = (now - LN.t0) / 1000;
  if (LN.phase === 'poll') {
    $('#ln-num').textContent = `${LN.go.filter(Boolean).length}/${LN.go.length}`;
  }
  if (LN.phase === 'count') {
    const T = 10 - Math.floor(t);
    $('#ln-label').textContent = 'T MINUS';
    $('#ln-num').textContent = String(Math.max(0, T)).padStart(2, '0');
    $('#ln-event').textContent = T <= 6 ? (T <= 3 ? 'ENGINES AT FULL POWER' : 'MAIN ENGINES START') : '';
    $('#launch-stage').classList.toggle('shake', T <= 6);
    if (t >= 10) {
      LN.phase = 'lift'; LN.t0 = now;
      $('#ln-poll').classList.add('hidden'); $('#ln-big').classList.remove('hidden'); $('#ln-tel').classList.remove('hidden');
      const v = $('#ln-video'); if (!v.classList.contains('hidden')) { v.currentTime = 0; v.play().catch(() => {}); }
      $('#ln-say').innerHTML = hydrusSays(`We have liftoff! Hydrus 2040 has cleared the tower. Next stop: ${GAME.destination.name.charAt(0) + GAME.destination.name.slice(1).toLowerCase()}!`);
    }
  }
  if (LN.phase === 'lift') {
    $('#ln-label').textContent = 'T PLUS';
    $('#ln-num').textContent = '00:' + String(Math.floor(t)).padStart(2, '0');
    $('#ln-event').textContent = t > 4 ? 'BOOSTER SEPARATION' : '';
    $('#ln-big').style.opacity = Math.max(0, 1 - (t - 1.5) / 1);
    $('#ln-tel').innerHTML = `<div>ALTITUDE<b>${(t * t * 4.2).toFixed(1)} km</b></div><div>SPEED<b>${Math.round(t * t * 310 + t * 120)} km/h</b></div><div>G-FORCE<b>${(1.2 + t * .45).toFixed(1)} g</b></div>`;
    $('#launch-stage').classList.toggle('shake', t < 5);
    $('.ln-bg').style.transform = `translateY(${t * t * 9}px)`;
    if (t > 7) { showScreen('trajectory'); return; }
  }
  LN.raf = requestAnimationFrame(launchLoop);
}
SCREENS.launch = { enter: launchEnter, key: launchKey };

/* =====================================================
   6. TRAJECTORY
   ===================================================== */
const TRAVEL_DAYS = { light: 180, medium: 210, heavy: 240 };   // a trip to Mars takes about 7 months
let trajRaf = 0;
function trajectoryEnter() {
  const days = TRAVEL_DAYS[GAME.rocket];
  const path = 'M 560 540 C 600 230, 1100 170, 1360 360';
  $('#traj-stage').innerHTML = `
    <div class="jr-bg"></div>
    <div class="ln-top"><h1>TRAJECTORY · EARTH → ${GAME.destination.name}</h1><small>Transfer orbit · ${days} days in space</small></div>
    <svg class="tr-map" viewBox="0 0 1920 1080">
      <circle cx="960" cy="560" r="400" fill="none" stroke="#38bdf855" stroke-dasharray="4 8"/>
      <circle cx="960" cy="560" r="560" fill="none" stroke="#f9731655" stroke-dasharray="4 8"/>
      <circle cx="960" cy="560" r="34" fill="#fde047"/><circle cx="960" cy="560" r="70" fill="#fde04722"/>
      <circle cx="560" cy="540" r="18" fill="#1d6fd8" stroke="#7dd3fc" stroke-width="3"/><text x="560" y="590" text-anchor="middle" fill="#7dd3fc" font-family="Orbitron" font-size="18">EARTH</text>
      <circle cx="1360" cy="360" r="15" fill="#dc5a2a"/><text x="1360" y="320" text-anchor="middle" fill="#fdba74" font-family="Orbitron" font-size="18">MARS</text>
      <path id="tr-path" d="${path}" fill="none" stroke="#38bdf8" stroke-width="4" style="filter:drop-shadow(0 0 8px #0ea5e9)"/>
      <g id="tr-ship"><path d="M14 0 L-10 -9 L-5 0 L-10 9Z" fill="#fff" stroke="#38bdf8" stroke-width="2"/><circle cx="-12" cy="0" r="4" fill="#f59e0b"/></g>
      <text id="tr-day" x="960" y="960" text-anchor="middle" fill="#e0f2fe" font-family="Orbitron" font-size="34"></text>
    </svg>
    ${hydrusSays('A trip to Mars takes about 7 months. NASA launches when Earth and Mars line up, about every 26 months.', 'style="left:40px;top:150px;width:620px"')}
    <button class="btn btn-main tr-go hidden" id="tr-go">TO THE MISSION MAP ▸</button>`;
  $('#tr-go').addEventListener('click', () => showScreen('map'));
  const p = $('#tr-path'), L = p.getTotalLength(), t0 = performance.now();
  cancelAnimationFrame(trajRaf);
  const loop = (now) => {
    if (currentScreen !== 'trajectory') return;
    const f = Math.min(1, (now - t0) / 6000), e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
    const a = p.getPointAtLength(L * e), b = p.getPointAtLength(Math.min(L, L * e + 1));
    $('#tr-ship').setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 57.3})`);
    $('#tr-day').textContent = `DAY ${Math.round(days * e)} / ${days}`;
    if (f >= 1) $('#tr-go').classList.remove('hidden'); else trajRaf = requestAnimationFrame(loop);
  };
  trajRaf = requestAnimationFrame(loop);
}
SCREENS.trajectory = { enter: trajectoryEnter, key: (i, k, d) => { if (d && k === 1 && !$('#tr-go').classList.contains('hidden')) showScreen('map'); } };

/* =====================================================
   7. MISSION MAP (click the points to see the plan)
   ===================================================== */
function mapEnter() {
  const m = mission();
  const route = m.map.map((p) => `${p.x * 12},${p.y * 9.4 + 90}`).join(' ');
  const plan = m.steps.filter((s) => s.type === 'event');
  $('#map-stage').innerHTML = `
    <div class="mp-bg"></div>
    <div class="ln-top"><h1>MISSION MAP · ${m.name} · ${m.place.toUpperCase()}</h1><small>${m.title} · Goal: ${m.goalName}</small></div>
    <svg class="mp-svg" viewBox="0 0 1920 1080">
      <polyline points="${route}" fill="none" stroke="#e0f2fe" stroke-width="4" stroke-dasharray="14 10" opacity=".85"/>
      ${m.map.map((p, i) => `<g class="mp-pin" data-i="${i}" transform="translate(${p.x * 12} ${p.y * 9.4 + 90})">
        <circle r="44" fill="${p.color}" opacity=".18"/><circle r="28" fill="#04122b" stroke="${p.color}" stroke-width="4"/>
        <text y="9" text-anchor="middle" font-size="24" font-family="Orbitron" fill="${p.color}">${p.icon}</text>
        <rect x="-95" y="36" width="190" height="28" rx="6" fill="#04122bdd"/>
        <text y="56" text-anchor="middle" font-size="13" font-family="Orbitron" fill="#e0f2fe">${p.label}</text></g>`).join('')}
    </svg>
    <div class="mp-card hidden" id="mp-card"></div>
    ${hydrusSays(`This is ${m.place}. Click any point to see what we will do there.`, 'style="left:40px;top:140px;width:640px"')}
    <aside class="mp-plan"><h3>MISSION PLAN</h3>
      ${plan.map((s, i) => `<div class="mp-day ${s.kind}"><b>${i + 1}</b><div><p>${s.alert}</p><small>${s.kind === 'decision' ? 'Team decision' : s.kind === 'minigame' ? 'Minigame · ' + s.station.toUpperCase() : 'Kit or minigame · ' + s.station.toUpperCase()}</small></div></div>`).join('')}
      <button class="lb" id="mp-start">START MISSION ▸</button></aside>`;
  $('.mp-svg').addEventListener('click', (e) => {
    const g = e.target.closest('.mp-pin'); if (!g) return;
    const p = m.map[+g.dataset.i], card = $('#mp-card');
    card.innerHTML = `<b style="color:${p.color}">${p.label}</b><p>${p.text}</p>`;
    card.style.left = Math.min(p.x * 12 + 50, 1040) + 'px'; card.style.top = Math.max(150, p.y * 9.4) + 'px';
    card.classList.remove('hidden');
  });
  $('#mp-start').addEventListener('click', startPlanet);
}
function startPlanet() {
  const m = mission();
  playAnimSlot({ title: 'LANDING', subtitle: `${m.name} · ${m.place}`, file: m.landingAnimation,
    note: 'Landing cinematic goes here in the final version', next: () => showScreen('level') });
}
SCREENS.map = { enter: mapEnter };

/* =====================================================
   8. ANIMATION SLOT
   If "file" is a video path, it plays. If not, a placeholder
   shows for a few seconds. Press SKIP or any middle key.
   ===================================================== */
let ANIM = { next: null, timer: 0 };
function playAnimSlot({ title, subtitle, file, note, next }) {
  ANIM.next = next;
  showScreen('anim');
  $('#anim-stage').innerHTML = `
    <div class="jr-bg"></div>
    <div class="an-box">${file ? `<video id="an-video" src="${file}" autoplay muted playsinline></video>` : ''}
      <div class="an-ph" id="an-ph"><h2>ANIMATION SLOT</h2><p>${note || ''}</p><small>FILE: ${file || 'not added yet'}</small></div></div>
    <div class="an-title"><h1>${title}</h1><p>${subtitle}</p></div>
    <button class="btn btn-main an-skip" id="an-skip">SKIP ▸</button>`;
  const go = () => { clearTimeout(ANIM.timer); const n = ANIM.next; ANIM.next = null; if (n) n(); };
  $('#an-skip').addEventListener('click', go);
  const v = $('#an-video');
  if (v) { v.addEventListener('loadeddata', () => $('#an-ph').classList.add('hidden')); v.addEventListener('ended', go); v.addEventListener('error', () => { ANIM.timer = setTimeout(go, 4000); }); }
  else ANIM.timer = setTimeout(go, 4000);
}
SCREENS.anim = { key: (i, k, d) => { if (d && k === 1 && ANIM.next) $('#an-skip').click(); } };
