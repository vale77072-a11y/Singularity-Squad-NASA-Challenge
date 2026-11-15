/* =====================================================
   HYDRUS 2040 — TITLE SCREEN
   ===================================================== */

$('#btn-start').addEventListener('click', () => showScreen('intro'));

$('#btn-credits').addEventListener('click', () => {
  const items = CREDITS.map((line) => `<li>${line}</li>`).join('');
  openModal(`<h3>CREDITS</h3><ul class="credits">${items}</ul>`);
});
