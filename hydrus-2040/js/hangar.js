/* =====================================================
   HYDRUS 2040 — HANGAR
   Choose a rocket, the fuel and the equipment.
   Everything is recalculated each time something changes.
   ===================================================== */

const rocket = () => ROCKETS.find((r) => r.id === GAME.rocket);
const info = () => PLANET_INFO[GAME.destination.id];
const qty = (id) => GAME.items[id] || 0;
const money = (n) => '$' + Math.round(n) + 'M';
// "the Moon", "Mars", "Europa": how the place is written inside a sentence
const placeName = (p) => p.id === 'moon' ? 'the Moon' : p.name.charAt(0) + p.name.slice(1).toLowerCase();

/* ---------- All the numbers ---------- */
function calculate() {
  const r = rocket(), p = GAME.destination, pi = info();
  let weight = 0, gearCost = 0, made = 0, used = BASE_POWER_USE, backup = 0;

  EQUIPMENT.forEach((e) => {
    const n = qty(e.id);
    if (!n) return;
    weight += e.weight * n;
    gearCost += e.cost * n;
    if (e.solarPower) made += Math.round(e.solarPower * p.sunlight) * n;
    if (e.power > 0) made += e.power * n;
    if (e.power < 0) used += -e.power * n;
    if (e.backup) backup += e.backup * n;
  });

  // Fuel and the rocket equation: Δv = Isp · g0 · ln(full mass / empty mass)
  const fuelCost = Math.round(GAME.fuel / 10) * FUEL_COST_PER_10;
  const fuelMass = r.fuelMax * GAME.fuel / 100;
  const empty = r.dryMass + weight;
  const ve = r.isp * 9.81 / 1000;                       // km/s
  const dv = ve * Math.log((empty + fuelMass) / empty);
  const need = pi.dvNeeded;
  const minFuel = Math.min(100, Math.ceil((Math.exp(need / ve) - 1) * empty / r.fuelMax * 100));
  let fuelState = 'safe';
  if (dv < need) fuelState = 'short';
  else if (dv < need * 1.08) fuelState = 'noreserve';
  else if (dv > need * 1.35) fuelState = 'waste';

  // Science
  const cam = qty('camera') > 0, lab = qty('lab') > 0;
  const dataPerSample = DATA_PER_SAMPLE[cam && lab ? 'both' : lab ? 'lab' : cam ? 'camera' : 'none'];

  // Hazards
  const covered = (h) => h.coveredBy.some((c) => {
    if (c === 'always') return true;
    const [id, min] = c.split(':');
    return qty(id) >= (+min || 1);
  });
  const hazards = pi.hazards.map((h) => ({ ...h, covered: covered(h) }));
  const total = hazards.reduce((a, h) => a + h.level, 0);
  const safe = hazards.filter((h) => h.covered).reduce((a, h) => a + h.level, 0);

  const cost = r.cost + gearCost + fuelCost;
  const powerOk = made >= used;
  let readiness = (safe / total) * 72
    + { safe: 20, waste: 15, noreserve: 8, short: 0 }[fuelState]
    + (powerOk ? 5 : -10) + (cam || lab ? 0 : -5);
  readiness = Math.max(3, Math.min(99, Math.round(readiness)));

  const overWeight = weight > r.payload, overBudget = cost > BUDGET;
  const canLaunch = !overWeight && !overBudget && fuelState !== 'short' && powerOk;

  return { r, p, pi, weight, gearCost, fuelCost, cost, made, used, backup, dv, need, minFuel, fuelState,
    dataPerSample, hazards, readiness, powerOk, overWeight, overBudget, canLaunch,
    coveredCount: hazards.filter((h) => h.covered).length };
}

/* ---------- Top bars ---------- */
function meter(id, label, value, pct, note, state, gradient) {
  $(id).innerHTML = `
    <div class="h">${label}<b>${value}</b></div>
    <div class="bar"><i style="width:${Math.min(100, pct)}%;background:${gradient}"></i></div>
    <small class="${state}">${note}</small>`;
}

function renderMeters(c) {
  const left = BUDGET - c.cost, room = c.r.payload - c.weight;
  meter('#m-budget', 'BUDGET', `${money(c.cost)} / ${money(BUDGET)}`, c.cost / BUDGET * 100,
    c.overBudget ? `Over budget by ${money(-left)}!` : `${money(left)} left · fuel ${money(c.fuelCost)}`,
    c.overBudget ? 'bad' : left <= 5 ? 'warn' : 'ok', c.overBudget ? '#ef4444' : 'linear-gradient(90deg,#0ea5e9,#fde047)');
  meter('#m-weight', 'WEIGHT', `${c.weight} / ${c.r.payload} kg`, c.weight / c.r.payload * 100,
    c.overWeight ? `Too heavy by ${-room} kg!` : `${room} kg of room`,
    c.overWeight ? 'bad' : 'ok', c.overWeight ? '#ef4444' : 'linear-gradient(90deg,#0ea5e9,#38bdf8)');
  meter('#m-power', `POWER ON ${c.p.name}`, `${c.made} W / ${c.used} W`, c.made ? c.used / c.made * 100 : 100,
    c.powerOk ? `+${c.made - c.used} W spare · sunlight ${Math.round(c.p.sunlight * 100)}%` : `Short ${c.used - c.made} W: add a power source`,
    c.powerOk ? 'ok' : 'bad', c.powerOk ? 'linear-gradient(90deg,#0ea5e9,#86efac)' : '#ef4444');
  meter('#m-data', 'DATA TO EARTH', `${c.dataPerSample} pts / sample`, c.dataPerSample / 15 * 100,
    `${qty('antenna') ? 'Antenna: sends 2× faster' : 'No antenna: slow to send'} · signal ${c.pi.env.find((e) => e[0] === 'SIGNAL')[1]}`,
    qty('antenna') ? 'purple' : 'warn', 'linear-gradient(90deg,#0ea5e9,#a78bfa)');
}

/* ---------- 1. Rockets and fuel ---------- */
function renderRockets() {
  const bar = (v, mx) => `<div class="mb"><i style="width:${v / mx * 100}%"></i></div>`;
  $('#rocket-list').innerHTML = ROCKETS.map((r) => {
    const on = r.id === GAME.rocket, h = r.height;
    return `<button class="rk ${on ? 'on' : ''}" data-rocket="${r.id}">
      <svg viewBox="0 0 40 90" class="rs" aria-hidden="true">
        <path d="M20 ${90 - h} C12 ${96 - h} 10 ${104 - h} 10 ${110 - h} L10 80 L30 80 L30 ${110 - h} C30 ${104 - h} 28 ${96 - h} 20 ${90 - h}Z" fill="${on ? '#bae6fd' : '#64748b'}"/>
        <path d="M10 66 L3 84 L10 80Z M30 66 L37 84 L30 80Z" fill="${on ? '#7dd3fc' : '#475569'}"/><path d="M15 80 L20 90 L25 80Z" fill="#f59e0b"/></svg>
      <div class="rkb"><div class="rkh"><b>${r.name}</b>${on ? '<span class="sel">SELECTED</span>' : ''}</div>
        <div class="st"><span>Payload</span><b>${r.payload} kg</b></div>${bar(r.payload, 100)}
        <div class="st"><span>Cost</span><b>${money(r.cost)}</b></div>${bar(r.cost, 40)}
        <div class="st"><span>Days to explore</span><b>${r.days}</b></div>${bar(r.days, 10)}</div>
    </button>`;
  }).join('');
}

function renderFuel(c) {
  $('#fuel-pct').textContent = GAME.fuel + '%';
  $('#fuel-dv').innerHTML = `Δv <b>${c.dv.toFixed(1)}</b> km/s · needed <b>${c.need.toFixed(1)}</b>`;
  const range = $('#fuel-range');
  range.value = GAME.fuel;
  range.style.setProperty('--fill', GAME.fuel + '%');
}

/* ---------- Assembly bay drawing ---------- */
function renderBay(c) {
  const scale = { light: 0.86, medium: 1, heavy: 1.12 }[GAME.rocket];
  const tankTop = 196, tankH = 190, usable = 184;
  const fuelH = usable * GAME.fuel / 100;
  const minY = tankTop + 3 + usable - usable * Math.min(c.minFuel, 100) / 100;

  let slots = '';
  EQUIPMENT.forEach((e, i) => {
    const x = 212 + (i % 4) * 36, y = 118 + Math.floor(i / 4) * 34, n = qty(e.id);
    slots += n
      ? `<rect x="${x}" y="${y}" width="32" height="28" rx="3" fill="${CATEGORY_COLORS[e.cat]}"/>
         <text x="${x + 16}" y="${y + 18}" font-size="${n > 1 ? 8 : 9}" font-weight="800" text-anchor="middle" fill="#04060c">${e.tag}${n > 1 ? '×' + n : ''}</text>`
      : `<rect x="${x}" y="${y}" width="32" height="28" rx="3" fill="none" stroke="#38bdf855" stroke-dasharray="3 3"/>`;
  });

  const filled = EQUIPMENT.filter((e) => qty(e.id)).length;
  $('#bay-sub').textContent = `// ${c.r.name} ROCKET · ${c.p.name} MISSION`;
  $('#rocket-svg').innerHTML = `
    <defs>
      <linearGradient id="hull" x1="0" x2="1"><stop offset="0" stop-color="#0f1f3d"/><stop offset=".5" stop-color="#22385f"/><stop offset="1" stop-color="#0b1730"/></linearGradient>
      <linearGradient id="fuelg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0369a1"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>
      <radialGradient id="flame"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#7dd3fc"/><stop offset="1" stop-color="#7dd3fc00"/></radialGradient>
    </defs>
    <line x1="40" y1="452" x2="520" y2="452" stroke="#1e3a5f" stroke-width="2"/>
    ${Array.from({ length: 20 }, (_, k) => `<line x1="${60 + k * 24}" y1="452" x2="${46 + k * 24}" y2="466" stroke="#1e3a5f"/>`).join('')}
    <g id="rocket-group" transform="translate(${280 - 260 * scale} ${452 - 452 * scale}) scale(${scale})">
      <path d="M260 22 C236 50 192 86 188 104 L332 104 C328 86 284 50 260 22Z" fill="url(#hull)" stroke="#38bdf8" stroke-width="2"/>
      <circle cx="260" cy="76" r="9" fill="#0b1730" stroke="#7dd3fc" stroke-width="2"/>
      <rect x="188" y="104" width="144" height="92" fill="#06122a" stroke="#38bdf8" stroke-width="2"/>${slots}
      <rect x="188" y="${tankTop}" width="144" height="${tankH}" fill="url(#hull)" stroke="#38bdf8" stroke-width="2"/>
      <rect x="194" y="${tankTop + 3 + usable - fuelH}" width="132" height="${fuelH}" fill="url(#fuelg)" opacity=".85"/>
      <text x="260" y="300" font-family="Orbitron" font-size="15" letter-spacing="2" text-anchor="middle" fill="#e0f2fe">FUEL ${GAME.fuel}%</text>
      <line x1="194" y1="${minY}" x2="326" y2="${minY}" stroke="#f87171" stroke-dasharray="5 4" stroke-width="2"/>
      <text x="322" y="${minY - 4}" font-size="9" text-anchor="end" fill="#fca5a5">MIN FOR ${c.p.name}</text>
      <path d="M188 300 L146 400 L188 384Z" fill="#0f1f3d" stroke="#38bdf8" stroke-width="2"/>
      <path d="M332 300 L374 400 L332 384Z" fill="#0f1f3d" stroke="#38bdf8" stroke-width="2"/>
      <path d="M240 386 L280 386 L298 420 L222 420Z" fill="#334155" stroke="#38bdf8" stroke-width="2"/>
      <ellipse class="flame" cx="260" cy="436" rx="30" ry="20" fill="url(#flame)"/>
    </g>
    <g font-size="12" fill="#9cc7e4">
      <line x1="208" y1="150" x2="130" y2="150" stroke="#38bdf888" stroke-dasharray="3 3"/>
      <text x="16" y="138" fill="#7dd3fc" font-family="Orbitron" font-size="11" letter-spacing="2">PAYLOAD BAY</text>
      <text x="16" y="156">${filled} / 8 items · ${c.weight} kg</text>
      <line x1="208" y1="260" x2="130" y2="260" stroke="#38bdf888" stroke-dasharray="3 3"/>
      <text x="16" y="248" fill="#7dd3fc" font-family="Orbitron" font-size="11" letter-spacing="2">POWER</text>
      <text x="16" y="266">${c.made} W made · ${c.used} W used</text>
      <line x1="352" y1="170" x2="410" y2="170" stroke="#38bdf888" stroke-dasharray="3 3"/>
      <text x="416" y="158" fill="#7dd3fc" font-family="Orbitron" font-size="11" letter-spacing="2">EXPLORATION</text>
      <text x="416" y="176">${c.r.days} days on ${placeName(c.p)}</text>
      <line x1="352" y1="290" x2="410" y2="290" stroke="#38bdf888" stroke-dasharray="3 3"/>
      <text x="416" y="278" fill="#7dd3fc" font-family="Orbitron" font-size="11" letter-spacing="2">FUEL</text>
      <text x="416" y="296">${GAME.fuel}% · Δv ${c.dv.toFixed(1)} of ${c.need.toFixed(1)}</text>
      <line x1="318" y1="410" x2="410" y2="410" stroke="#38bdf888" stroke-dasharray="3 3"/>
      <text x="416" y="398" fill="#7dd3fc" font-family="Orbitron" font-size="11" letter-spacing="2">COST</text>
      <text x="416" y="416">${money(c.r.cost)} rocket + ${money(c.gearCost)} gear</text>
      <text x="416" y="432">+ ${money(c.fuelCost)} fuel</text>
    </g>`;
}

/* ---------- 2. Equipment with recommendations ---------- */
function renderEquipment(c) {
  $('#equip-sub').textContent = `Control Hydrus recommendations for ${placeName(c.p)}`;
  $('#env').innerHTML = c.pi.env.map(([k, v]) => `<span><b>${k}</b>${v}</span>`).join('');
  $('#equip-list').innerHTML = EQUIPMENT.map((e) => {
    const n = qty(e.id), [rec, why] = c.pi.recs[e.id];
    let power = e.power || 0;
    if (e.solarPower) power = Math.round(e.solarPower * c.p.sunlight);
    const pw = e.backup ? `+${e.backup} h backup` : power > 0 ? `+${power} W${e.solarPower ? ' here' : ''}` : power < 0 ? `−${-power} W` : '0 W';
    const pwClass = power > 0 || e.backup ? 'plus' : power < 0 ? 'minus' : '';
    const control = e.max
      ? `<div class="step"><span data-act="less" data-id="${e.id}">−</span><b>${n}</b><span data-act="more" data-id="${e.id}">+</span></div>`
      : `<span class="tick">${n ? '✓' : '+'}</span>`;
    return `<div class="item ${n ? 'on' : ''}" data-act="toggle" data-id="${e.id}" role="button" tabindex="0" aria-pressed="${n > 0}">
      <span class="ic" style="--c:${CATEGORY_COLORS[e.cat]}">${e.tag}</span>
      <div class="im"><b>${e.name}</b>
        <div class="stats"><span>${e.weight} kg</span><span>${money(e.cost)}</span><span class="${pwClass}">${pw}</span></div>
        <div class="rec ${rec}"><b>${REC_LABELS[rec]}</b><span>${why}</span></div>
      </div>${control}</div>`;
  }).join('');
}

/* ---------- 3. Hazards ---------- */
function renderHazards(c) {
  $('#hazards').innerHTML = c.hazards.map((h) => `
    <div class="hz">
      <div class="hzn"><b>${h.name}</b>
        <span class="lv">${[0, 1, 2, 3, 4].map((k) => `<i class="${k < h.level ? 'f' : ''}"></i>`).join('')}</span>
        <small>${['', 'LOW', 'MEDIUM', 'HIGH', 'VERY HIGH', 'EXTREME'][h.level]}</small></div>
      <div class="hzp ${h.covered ? 'ok' : 'no'}">${h.covered ? '✓ ' + h.ok : '✗ ' + h.no}</div>
      <div class="hzx">${h.note}</div>
    </div>`).join('');
}

/* ---------- 4. Crew stations ---------- */
function renderCrew() {
  const n = GAME.players.length;
  $('#crew-stations').innerHTML = GAME.players.map((name, i) => {
    const st = PLAYER_STYLE[i];
    const mine = STATIONS.filter((_, k) => k % n === i);
    return `<div class="cm"${n === 1 ? ' style="grid-column:span 2"' : ''}><span class="sh" style="color:${st.color}">${st.shape}</span>
      <div><b>${escapeHTML(name)}</b><small>Keys ${st.keys}</small></div>
      <div class="stns">${mine.map((s) => `<span class="stn" style="color:${s.color};border-color:${s.color}">${s.name}</span>`).join('')}</div></div>`;
  }).join('');
}

function escapeHTML(t) {
  return String(t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* ---------- Control Hydrus tip ---------- */
function hydrusTip(c) {
  const planet = placeName(c.p);
  if (c.overWeight) return `Too heavy! Remove ${c.weight - c.r.payload} kg of equipment, or choose a bigger rocket.`;
  if (c.overBudget) return `We're over budget by ${money(c.cost - BUDGET)}. Remove something or use a little less fuel.`;
  if (c.fuelState === 'short') return `Not enough fuel to reach ${planet}. Add fuel, or carry less weight: lighter rockets need less fuel.`;
  if (!c.powerOk) return `Not enough power: you make ${c.made} W but need ${c.used} W. Add a power source that works on ${planet}.`;
  if (c.fuelState === 'noreserve') return `You'll reach ${planet}, but with no fuel left for landing corrections. A little more fuel is safer.`;
  const missing = EQUIPMENT.find((e) => (c.pi.recs[e.id][0] === 'yes') && !qty(e.id));
  if (missing) return `${missing.name} is recommended for ${planet}: ${c.pi.recs[missing.id][1]}`;
  if (c.fuelState === 'waste') return `You're carrying much more fuel than you need. Lower it and spend the money on equipment.`;
  return `Great setup for ${planet}. Ready when you are, team!`;
}

/* ---------- Why we can't launch ---------- */
// Each reason says what is wrong, how to fix it, and which part of the hangar to look at.
function blockReasons(c) {
  const place = placeName(c.p), out = [];
  if (c.overWeight) out.push({ target: '#m-weight', short: 'Too heavy', text: `Too heavy: ${c.weight} kg on a rocket that carries ${c.r.payload} kg. Remove ${c.weight - c.r.payload} kg or pick a bigger rocket.` });
  if (c.overBudget) out.push({ target: '#m-budget', short: 'Over budget', text: `Over budget by ${money(c.cost - BUDGET)}. Remove equipment, use a cheaper rocket or less fuel.` });
  if (c.fuelState === 'short') out.push({ target: '.hg-fuel', short: 'Not enough fuel', text: `Not enough fuel: Δv ${c.dv.toFixed(1)} km/s, but ${place} needs ${c.need.toFixed(1)}. Raise the fuel to at least ${c.minFuel}% or carry less weight.` });
  if (!c.powerOk) out.push({ target: '#m-power', short: 'Not enough power', text: `Not enough power: we make ${c.made} W but need ${c.used} W. Add a power source that works on ${place}.` });
  return out;
}

/* ---------- Readiness gauge ---------- */
function renderGauge(c) {
  const p = c.readiness, a = Math.PI * (1 - p / 100);
  const x = 150 + 120 * Math.cos(a), y = 150 - 120 * Math.sin(a);
  $('#gauge').innerHTML = `
    <defs><linearGradient id="gg"><stop offset="0" stop-color="#f87171"/><stop offset=".5" stop-color="#fde047"/><stop offset="1" stop-color="#86efac"/></linearGradient></defs>
    <path d="M30 150 A120 120 0 0 1 270 150" stroke="#0b1a33" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M30 150 A120 120 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}" stroke="url(#gg)" stroke-width="22" fill="none" stroke-linecap="round"/>
    <text x="150" y="132" text-anchor="middle" font-family="Orbitron" font-size="46" fill="#e0f2fe">${p}%</text>
    <text x="150" y="160" text-anchor="middle" font-size="14" fill="#9cc7e4">chance to find the water</text>`;
  const fuelWord = { safe: 'fuel OK', waste: 'too much fuel', noreserve: 'no fuel reserve', short: 'not enough fuel' }[c.fuelState];
  $('#risk-text').textContent = `${c.coveredCount} of ${c.hazards.length} hazards covered · ${fuelWord} · ${c.p.difficulty} mission`;
  const btn = $('#launch-btn');
  btn.classList.toggle('blocked', !c.canLaunch);
  btn.innerHTML = c.canLaunch ? 'LAUNCH &#9656;' : 'LAUNCH BLOCKED';
  $('#risk-text').classList.toggle('hidden', !c.canLaunch);
  $('#blocked-list').innerHTML = c.canLaunch ? '' :
    '<li class="bl-title">WE CAN\'T LAUNCH YET</li><li>' + blockReasons(c).map((r) => r.short).join(' · ') +
    '</li><li class="bl-help">Press the button to see why</li>';
}

/* ---------- Draw everything ---------- */
let current = null;
function updateHangar() {
  const c = calculate();
  current = c;
  $('#hg-sub').innerHTML = `${c.p.name.charAt(0) + c.p.name.slice(1).toLowerCase()} · ${c.p.title} · ${c.p.difficulty}<br>Crew: ` +
    GAME.players.map((n, i) => `<span style="color:${PLAYER_STYLE[i].color}">${PLAYER_STYLE[i].shape}</span> ${escapeHTML(n)}`).join(' &nbsp;');
  renderMeters(c); renderRockets(); renderFuel(c); renderBay(c); renderEquipment(c);
  renderHazards(c); renderCrew(); renderGauge(c);
  $('#hint-text').textContent = hydrusTip(c);
}

/* ---------- Launch summary window ---------- */
function openSummary() {
  const c = current;
  if (!c.canLaunch) {                 // Control Hydrus explains why, pointing at the problem
    const reasons = blockReasons(c);
    showHydrusMessage(reasons[0].target,
      `<b class="tour-warn">We can't launch yet!</b>` + reasons.map((r) => `• ${r.text}`).join('<br>'));
    return;
  }
  const onBoard = EQUIPMENT.filter((e) => qty(e.id));
  const behind = EQUIPMENT.filter((e) => !qty(e.id));
  const missedRecs = behind.filter((e) => ['yes', 'best'].includes(c.pi.recs[e.id][0]));
  const n = GAME.players.length;
  $('#summary-grid').innerHTML = `
    <div class="sc"><h4>DESTINATION</h4><div class="dest"><img src="${c.p.image}" alt=""><p><span class="big">${c.p.name}</span><br>${c.p.title} · ${c.p.difficulty}<br>Goal: ${c.pi.goal.toLowerCase()}</p></div></div>
    <div class="sc"><h4>ROCKET AND FUEL</h4><p><span class="big">${c.r.name}</span><br>${c.r.payload} kg payload · ${c.r.days} days to explore<br>
      Fuel <b>${GAME.fuel}%</b> · Δv <b>${c.dv.toFixed(1)}</b> of ${c.need.toFixed(1)} km/s ${c.fuelState === 'safe' || c.fuelState === 'waste' ? '<span class="good">✓</span>' : '<span class="warn">(no reserve)</span>'}</p></div>
    <div class="sc"><h4>MISSION READINESS</h4><div class="rd"><span class="big">${c.readiness}%</span><p>chance to find the water<br>${c.coveredCount} of ${c.hazards.length} hazards covered</p></div></div>
    <div class="sc wide2"><h4>EQUIPMENT ON BOARD · ${onBoard.length} OF 8</h4>
      <div class="eq">${onBoard.map((e) => `<span style="background:${CATEGORY_COLORS[e.cat]}">${e.tag} ${e.name}${qty(e.id) > 1 ? ' ×' + qty(e.id) : ''}</span>`).join('') || '<em>Nothing on board!</em>'}</div>
      <p style="margin-top:9px">Left behind: ${behind.map((e) => e.name).join(', ') || 'nothing'}</p>
      ${missedRecs.length ? `<p class="warn">⚠ ${missedRecs.map((e) => e.name).join(' and ')} ${missedRecs.length > 1 ? 'were' : 'was'} recommended for ${placeName(c.p)}.</p>` : '<p class="good">✓ You took everything Control Hydrus recommended.</p>'}</div>
    <div class="sc"><h4>RESOURCES</h4><div class="tot">
      <div>Budget<b>${money(c.cost)}</b></div><div>Weight<b>${c.weight} kg</b></div>
      <div>Power<b class="${c.powerOk ? 'good' : 'warn'}">${c.made - c.used >= 0 ? '+' : ''}${c.made - c.used} W</b></div><div>Data<b>${c.dataPerSample} / sample</b></div>
      <div>Left<b>${money(BUDGET - c.cost)}</b></div><div>Room<b>${c.r.payload - c.weight} kg</b></div></div></div>
    <div class="sc wide3"><h4>CREW STATIONS</h4><div class="crewl">${GAME.players.map((name, i) =>
      `<span><b style="color:${PLAYER_STYLE[i].color}">${PLAYER_STYLE[i].shape} ${escapeHTML(name)}</b> · ${STATIONS.filter((_, k) => k % n === i).map((s) => s.name.charAt(0) + s.name.slice(1).toLowerCase()).join(', ')}</span>`).join('')}</div></div>`;
  $('#summary-modal').classList.remove('hidden');
  $('#sum-go').focus();
}

function confirmLaunch() {
  $('#summary-modal').classList.add('hidden');
  $('#rocket-group').classList.add('liftoff');
  setTimeout(() => openModal(`<h3>LIFTOFF!</h3><p>${GAME.destination.name}, here we come.<br>Next part: the journey and the emergencies. We build it next!</p>`), 1900);
}

/* ---------- Clicks ---------- */
$('#rocket-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-rocket]');
  if (b) { GAME.rocket = b.dataset.rocket; updateHangar(); }
});

$('#fuel-range').addEventListener('input', (e) => { GAME.fuel = +e.target.value; updateHangar(); });

$('#equip-list').addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const id = el.dataset.id, item = EQUIPMENT.find((x) => x.id === id), n = qty(id);
  if (el.dataset.act === 'more') GAME.items[id] = Math.min(item.max, n + 1);
  else if (el.dataset.act === 'less') GAME.items[id] = Math.max(0, n - 1);
  else GAME.items[id] = n ? 0 : 1;
  e.stopPropagation();
  updateHangar();
});
$('#equip-list').addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.item')) { e.preventDefault(); e.target.click(); }
});

$('#launch-btn').addEventListener('click', openSummary);
$('#sum-back').addEventListener('click', () => $('#summary-modal').classList.add('hidden'));
$('#sum-go').addEventListener('click', confirmLaunch);
$('#hg-back').addEventListener('click', () => showScreen('destinations'));

/* ---------- Fit the 1920 x 1080 hangar to any screen ---------- */
function fitHangar() {
  const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  $('#hg-stage').style.transform = `translate(-50%, -50%) scale(${k})`;
}
window.addEventListener('resize', fitHangar);

SCREENS.hangar = {
  enter: () => {
    if (!GAME.players.length) GAME.players = ['Astronaut 1'];
    fitHangar();
    updateHangar();
    if (!GAME.tourDone) { GAME.tourDone = true; setTimeout(startTour, 500); }   // first visit only
  }
};
