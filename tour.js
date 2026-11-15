/* =====================================================
   HYDRUS 2040 — HANGAR TOUR
   Control Hydrus lights up each part of the hangar and explains it.
   Texts are in data.js (HANGAR_TOUR).
   ===================================================== */

let tourStep = 0;
let tourMode = 'tour';      // 'tour' = guided tour · 'message' = one message (for example, why we can't launch)

function fillPlanet(text) {
  const p = GAME.destination;
  const Planet = p.name.charAt(0) + p.name.slice(1).toLowerCase();
  return text.replaceAll('{Planet}', Planet).replaceAll('{place}', placeName(p));
}

// Size of the hangar on screen (it is scaled to fit)
function stageScale() {
  return $('#hg-stage').getBoundingClientRect().width / 1920;
}

// Light up one part of the hangar (or several, separated by commas)
function spotlight(selector) {
  const spot = $('#tour-spot'), box = $('#tour-box');
  const stage = $('#hg-stage').getBoundingClientRect(), k = stageScale();

  if (!selector) {                                   // whole hangar: box in the center
    spot.style.cssText = 'left:960px;top:540px;width:0;height:0';
    box.style.left = (960 - 330) + 'px';
    box.style.top = (540 - 110) + 'px';
    return;
  }
  const rects = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect());
  const L = Math.min(...rects.map((r) => r.left)), T = Math.min(...rects.map((r) => r.top));
  const Rr = Math.max(...rects.map((r) => r.right)), B = Math.max(...rects.map((r) => r.bottom));
  const x = (L - stage.left) / k - 8, y = (T - stage.top) / k - 8;
  const w = (Rr - L) / k + 16, h = (B - T) / k + 16;
  spot.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px`;

  // Put the message below the part if there is room, otherwise above it (or beside it)
  const boxW = 660, boxH = box.offsetHeight || 220;
  let bx = Math.min(Math.max(x + w / 2 - boxW / 2, 20), 1920 - boxW - 20);
  let by = y + h + 18;
  if (by + boxH > 1060) by = y - boxH - 18;
  if (by < 20) {                                     // tall part: put it to the side
    by = Math.min(Math.max(y + h / 2 - boxH / 2, 20), 1060 - boxH);
    bx = x + w + 18 + boxW < 1900 ? x + w + 18 : x - boxW - 18;
  }
  box.style.left = bx + 'px';
  box.style.top = by + 'px';
}

function showTourStep() {
  const s = HANGAR_TOUR[tourStep];
  $('#tour-msg').textContent = fillPlanet(s.text);
  $('#tour-step').textContent = `· ${tourStep + 1} / ${HANGAR_TOUR.length}`;
  $('#tour-next').innerHTML = tourStep === HANGAR_TOUR.length - 1 ? "LET'S GO &#9656;" : 'NEXT &#9656;';
  $('#tour-skip').classList.toggle('hidden', tourStep === HANGAR_TOUR.length - 1);
  spotlight(s.target);
  requestAnimationFrame(() => spotlight(s.target));   // second pass, once the text size is known
}

function startTour() {
  tourMode = 'tour';
  tourStep = 0;
  $('#tour').classList.remove('hidden');
  showTourStep();
  $('#tour-next').focus();
}

function endTour() {
  $('#tour').classList.add('hidden');
}

// A single message from Control Hydrus, pointing at one part of the hangar
function showHydrusMessage(selector, html) {
  tourMode = 'message';
  $('#tour').classList.remove('hidden');
  $('#tour-msg').innerHTML = html;
  $('#tour-step').textContent = '';
  $('#tour-next').innerHTML = 'GOT IT &#9656;';
  $('#tour-skip').classList.add('hidden');
  spotlight(selector);
  requestAnimationFrame(() => spotlight(selector));
  $('#tour-next').focus();
}

$('#tour-next').addEventListener('click', () => {
  if (tourMode === 'message' || tourStep === HANGAR_TOUR.length - 1) return endTour();
  tourStep++;
  showTourStep();
});
$('#tour-skip').addEventListener('click', endTour);
$('#hg-help').addEventListener('click', startTour);

document.addEventListener('keydown', (e) => {
  if ($('#tour').classList.contains('hidden')) return;
  if (e.key === 'Escape') endTour();
  if (e.key === 'ArrowRight') $('#tour-next').click();
});
