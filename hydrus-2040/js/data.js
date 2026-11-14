/* =====================================================
   HYDRUS 2040 — GAME TEXT AND DATA
   Change texts, images and planets here.
   The other files only read this one.
   ===================================================== */

/* ---------- Intro comic panels ----------
   image   : background picture (assets/images)
   caption : big box at the top-left (only panel 1)
   text    : what Control Hydrus says
   bubble  : where the speech bubble goes, in % of the screen
   planets : true = show the three real planet photos (panel 4)
   ------------------------------------------ */
const INTRO_PANELS = [
  {
    image: 'assets/images/bg-title.jpg',
    caption: { title: 'YEAR 2040', text: 'For the first time, young people from all over the world can travel to space.' }
  },
  {
    image: 'assets/images/intro-2.jpg',
    text: "Hi there! I'm Control Hydrus, your mission guide. I'll be with you every step of the way.",
    bubble: { left: 32.5, bottom: 28, width: 56 }
  },
  {
    image: 'assets/images/intro-3.jpg',
    text: "See how blue Earth is? That's water. And where there is water, there can be life.",
    bubble: { left: 32.5, bottom: 10, width: 39 }
  },
  {
    image: 'assets/images/intro-4.jpg',
    planets: true,
    text: "We think there's water out there too. Ice on the Moon, an ancient river on Mars and a hidden ocean on Europa."
  },
  {
    image: 'assets/images/intro-5.jpg',
    text: 'Our mission is named after Hydrus, the water snake of the southern sky. Fitting, right?',
    bubble: { left: 32.5, bottom: 33, width: 30 }
  },
  {
    image: 'assets/images/intro-6.jpg',
    text: "Your crew has one mission: follow the water. Everything you'll face really happened to a NASA mission. Ready?",
    bubble: { left: 32.5, bottom: 33, width: 33 },
    button: 'CHOOSE YOUR DESTINATION'
  }
];

/* ---------- Destinations ---------- */
const DESTINATIONS = [
  {
    id: 'moon',
    name: 'MOON',
    title: 'Ice in the Dark',
    difficulty: 'Easy',
    image: 'assets/images/moon.jpg',
    description: 'Our closest neighbor, about 3 days away. Your crew lands near the south pole, where some craters have not seen sunlight in billions of years. Hidden inside them: frozen water.'
  },
  {
    id: 'mars',
    name: 'MARS',
    title: 'The Last River',
    difficulty: 'Medium',
    image: 'assets/images/mars.jpg',
    description: 'Billions of years ago, a river filled Jezero Crater with water. Your crew searches its rocks for signs of ancient life. Mars gets only about 43% of the sunlight Earth gets.'
  },
  {
    id: 'europa',
    name: 'EUROPA',
    title: 'The Hidden Ocean',
    difficulty: 'Hard',
    image: 'assets/images/jupiter.jpg',
    description: "One of Jupiter's moons. Under its ice hides a salty ocean with about twice as much water as all of Earth's oceans. Brutal cold, strong radiation and almost no sunlight."
  }
];

const DESTINATION_GUIDE = 'Pick a world. Easy, medium or hard: every one of them hides water.';

/* ---------- Credits (add the NASA image IDs you used) ---------- */
const CREDITS = [
  'Hydrus 2040: Expedition in search of a blue footprint. Made for the NASA Space Apps Challenge 2026.',
  'Title background: Milky Way from the International Space Station, Expedition 44. Image iss044e045215, NASA.',
  'Moon, Mars and Jupiter photos: NASA (add image IDs).',
  'Astronaut photos: NASA (add image IDs). Mission patches removed.',
  'Intro drawings, code and part of the texts were made with help from AI (Claude).',
  'Fonts: Orbitron and Exo 2 (SIL Open Font License).'
];
