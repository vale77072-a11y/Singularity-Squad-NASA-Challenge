/* =====================================================
   HYDRUS 2040 — INTRO COMIC
   Next: button, click, Enter, Space or right arrow.
   Skip: "Skip intro" button or Escape.
   ===================================================== */

let panelIndex = 0;
let typingTimer = null;
let fullText = '';

// Writes the bubble text letter by letter.
function typeText(text) {
  clearInterval(typingTimer);
  fullText = text;
  const out = $('#bubble-text');
  out.textContent = '';
  let i = 0;
  typingTimer = setInterval(() => {
    i++;
    out.textContent = text.slice(0, i);
    if (i >= text.length) clearInterval(typingTimer);
  }, 28);
}

function isTyping() {
  return $('#bubble-text').textContent.length < fullText.length;
}

function showPanel(index) {
  panelIndex = index;
  const p = INTRO_PANELS[index];
  const stage = $('#intro-stage');

  // Background picture with a slow zoom
  const bg = $('#panel-bg');
  bg.style.backgroundImage = `url(${p.image})`;
  bg.classList.remove('zoom'); void bg.offsetWidth; bg.classList.add('zoom');

  // Big caption (panel 1)
  const cap = $('#caption');
  if (p.caption) {
    cap.innerHTML = `<div class="caption-title">${p.caption.title}</div><p>${p.caption.text}</p>`;
    cap.classList.add('show');
  } else {
    cap.classList.remove('show');
  }

  // Three planets (panel 4)
  const extra = $('#panel-extra');
  extra.innerHTML = '';
  if (p.planets) {
    DESTINATIONS.forEach((d, i) => {
      extra.innerHTML += `
        <div class="intro-planet" style="left:${18.75 + i * 31.25}%">
          <div class="planet-photo"><img src="${d.image}" alt="${d.name}"></div>
          <div class="intro-planet-name">${d.name}<small>${d.title}</small></div>
        </div>`;
    });
  }

  // Control Hydrus and his speech bubble
  const bubble = $('#bubble');
  stage.classList.toggle('with-hydrus', !!p.bubble);
  stage.classList.toggle('bottom-text', !!p.planets);
  if (p.bubble) {
    bubble.style.left = p.bubble.left + '%';
    bubble.style.bottom = p.bubble.bottom + '%';
    bubble.style.width = p.bubble.width + '%';
  } else {
    bubble.style.left = ''; bubble.style.bottom = ''; bubble.style.width = '';
  }
  if (p.text) {
    bubble.classList.add('show');
    typeText(p.text);
  } else {
    bubble.classList.remove('show');
    fullText = '';
    $('#bubble-text').textContent = '';
  }

  // Progress dots and button text
  $('#dots').innerHTML = INTRO_PANELS.map((_, i) => `<i class="${i === index ? 'on' : ''}"></i>`).join('');
  $('#btn-next').innerHTML = (p.button || 'NEXT') + ' &#9656;';
}

function nextPanel() {
  if (isTyping()) {                 // first press: finish the text
    clearInterval(typingTimer);
    $('#bubble-text').textContent = fullText;
    return;
  }
  if (panelIndex < INTRO_PANELS.length - 1) showPanel(panelIndex + 1);
  else endIntro();
}

function endIntro() {
  clearInterval(typingTimer);
  showScreen('destinations');
}

$('#btn-next').addEventListener('click', (e) => { e.stopPropagation(); nextPanel(); });
$('#btn-skip').addEventListener('click', (e) => { e.stopPropagation(); endIntro(); });
$('#intro-stage').addEventListener('click', nextPanel);

document.addEventListener('keydown', (e) => {
  if (!$('#screen-intro').classList.contains('active')) return;
  if (e.key === 'Escape') endIntro();
  if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextPanel(); }
});

SCREENS.intro = { enter: () => showPanel(0) };
