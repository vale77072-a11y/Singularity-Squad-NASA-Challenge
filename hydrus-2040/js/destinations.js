/* =====================================================
   HYDRUS 2040 — CHOOSE YOUR DESTINATION
   ===================================================== */

let chosenDestination = null;

function renderDestinations() {
  $('#dest-guide-text').textContent = DESTINATION_GUIDE;
  $('#dest-cols').innerHTML = DESTINATIONS.map((d) => `
    <button class="dest-card diff-${d.difficulty.toLowerCase()}" data-id="${d.id}">
      <span class="dest-diff">${d.difficulty.toUpperCase()}</span>
      <div class="planet-photo big"><img src="${d.image}" alt="Photo of ${d.name}"></div>
      <h3 class="dest-name">${d.name}</h3>
      <p class="dest-title">${d.title}</p>
      <p class="dest-desc">${d.description}</p>
    </button>`).join('');
}

function chooseDestination(id) {
  chosenDestination = DESTINATIONS.find((d) => d.id === id);
  document.querySelectorAll('.dest-card').forEach((c) => c.classList.toggle('selected', c.dataset.id === id));
  $('#dest-choice').innerHTML = `Destination: <b>${chosenDestination.name}</b> · ${chosenDestination.title}`;
  $('#dest-go').disabled = false;
}

$('#dest-cols').addEventListener('click', (e) => {
  const card = e.target.closest('.dest-card');
  if (card) chooseDestination(card.dataset.id);
});

$('#dest-back').addEventListener('click', () => showScreen('title'));

$('#dest-go').addEventListener('click', () => {
  GAME.destination = chosenDestination;
  openCrewWindow();          // asks how many astronauts, then the hangar opens
});

SCREENS.destinations = {
  enter: () => {
    chosenDestination = null;
    renderDestinations();
    $('#dest-choice').textContent = 'Pick a world to continue.';
    $('#dest-go').disabled = true;
  }
};
