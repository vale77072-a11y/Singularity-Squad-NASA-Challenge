/* =====================================================
   HYDRUS 2040 — SCREEN SWITCHER AND POP-UP WINDOW
   ===================================================== */

const $ = (selector) => document.querySelector(selector);

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
