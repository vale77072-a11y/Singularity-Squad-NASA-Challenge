/* =====================================================
   HYDRUS 2040 — CREW WINDOW
   Step 1: how many astronauts?  Step 2: their names.
   ===================================================== */

function openCrewWindow() {
  $('#crew-modal').classList.remove('hidden');
  askHowMany();
}

function closeCrewWindow() {
  $('#crew-modal').classList.add('hidden');
}

// Step 1
function askHowMany() {
  $('#crew-question').textContent = 'How many astronauts do we have here?';
  $('#crew-body').innerHTML = `
    <div class="cm-numbers">
      ${[1, 2, 3, 4].map((n) => `
        <button class="cm-num" data-n="${n}">
          <b>${n}</b>
          <span>${PLAYER_STYLE.slice(0, n).map((p) => `<i style="color:${p.color}">${p.shape}</i>`).join('')}</span>
        </button>`).join('')}
    </div>
    <p class="cm-note">Everyone plays on the same keyboard. Each astronaut gets 3 keys.</p>
    <div class="cm-actions"><button class="btn btn-small" id="crew-cancel">&#9666; Back</button></div>`;

  document.querySelectorAll('.cm-num').forEach((b) =>
    b.addEventListener('click', () => askNames(+b.dataset.n)));
  $('#crew-cancel').addEventListener('click', closeCrewWindow);
  document.querySelector('.cm-num').focus();
}

// Step 2
function askNames(n) {
  $('#crew-question').textContent = n === 1
    ? "Great! What's your name, astronaut?"
    : `Great, a crew of ${n}! What are your names?`;

  $('#crew-body').innerHTML = `
    <div class="cm-names">
      ${PLAYER_STYLE.slice(0, n).map((p, i) => `
        <label class="cm-row">
          <span class="cm-shape" style="color:${p.color}">${p.shape}</span>
          <input class="cm-input" maxlength="14" placeholder="Astronaut ${i + 1}"
                 value="${escapeHTML(GAME.players[i] || '')}" style="border-color:${p.color}" aria-label="Name of astronaut ${i + 1}">
          <span class="cm-keys">Keys ${p.keys}</span>
        </label>`).join('')}
    </div>
    <div class="cm-actions">
      <button class="btn btn-small" id="crew-back">&#9666; Back</button>
      <button class="btn btn-main" id="crew-go">TO THE HANGAR &#9656;</button>
    </div>`;

  const inputs = [...document.querySelectorAll('.cm-input')];
  const go = () => {
    GAME.players = inputs.map((inp, i) => inp.value.trim() || `Astronaut ${i + 1}`);
    closeCrewWindow();
    showScreen('hangar');
  };
  inputs.forEach((inp) => inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }));
  $('#crew-go').addEventListener('click', go);
  $('#crew-back').addEventListener('click', askHowMany);
  inputs[0].focus();
}
