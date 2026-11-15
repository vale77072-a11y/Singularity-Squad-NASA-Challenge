/* =====================================================
   HYDRUS 2040 — SCREEN SWITCHER AND POP-UP WINDOW
   ===================================================== */

const $ = (selector) => document.querySelector(selector);

// Everything the players choose during the game is saved here.
const GAME = {
  destination: null,   // chosen planet (from DESTINATIONS)
  players: [],         // crew names, in order (player 1, 2, 3, 4)
  rocket: 'medium',    // chosen rocket id (from ROCKETS)
  fuel: 50,            // fuel load in %
  items: {}            // equipment on board: { solar: 2, rtg: 1, ... }
};

// Each screen can have an "enter" function that runs when it opens.
const SCREENS = {};

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
  $('#screen-' + id).classList.add('active');
  if (SCREENS[id] && SCREENS[id].enter) SCREENS[id].enter();
}

/* ---------- Pop-up window ---------- */
function openModal(html) {
  $('#modal-content').innerHTML = html;
  $('#modal').classList.remove('hidden');
  $('#modal-close').focus();
}

function closeModal() {
  $('#modal').classList.add('hidden');
}

$('#modal-close').addEventListener('click', closeModal);
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').classList.contains('hidden')) closeModal(); });

/* ---------- Player keys (3 per player) ---------- */
const KEY_CODES = [
  ['KeyQ', 'KeyW', 'KeyE'],
  ['KeyC', 'KeyV', 'KeyB'],
  ['KeyI', 'KeyO', 'KeyP'],
  ['ArrowLeft', 'ArrowDown', 'ArrowRight']
];
let currentScreen = 'title';
const _show = showScreen;
showScreen = function (id) { currentScreen = id; _show(id); fitStages(); };

// The active screen receives player keys: key(player, key 0/1/2, isDown)
function routeKey(e, down) {
  const scr = SCREENS[currentScreen];
  if (!scr || !scr.key) return;
  const n = Math.max(1, GAME.players.length);
  for (let i = 0; i < n; i++) {
    const k = KEY_CODES[i].indexOf(e.code);
    if (k >= 0) { e.preventDefault(); if (!(down && e.repeat)) scr.key(i, k, down); return; }
  }
}
document.addEventListener('keydown', (e) => routeKey(e, true));
document.addEventListener('keyup', (e) => routeKey(e, false));

/* ---------- Screens drawn at 1920 x 1080, scaled to fit ---------- */
function fitStages() {
  const k = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.querySelectorAll('.stage1080').forEach((s) => { s.style.transform = `translate(-50%, -50%) scale(${k})`; });
}
window.addEventListener('resize', fitStages);

// Which player runs a station (with fewer players, stations are shared)
function stationPlayer(stationId) {
  const s = STATIONS.findIndex((x) => x.id === stationId);
  return s % Math.max(1, GAME.players.length);
}
const esc = (t) => String(t).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const KEY_LABELS = [['Q', 'W', 'E'], ['C', 'V', 'B'], ['I', 'O', 'P'], ['←', '↓', '→']];
const LAUNCH_VIDEO = null;   // real NASA launch video: put the file in assets/video/ and write its path here, e.g. 'assets/video/launch.mp4'
