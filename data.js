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
    caption: { title: 'YEAR 2040', text: "It's time for a new expedition. The year is 2040." }
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
    id: 'moon', available: false,
    name: 'MOON',
    title: 'Ice in the Dark',
    difficulty: 'Easy',
    image: 'assets/images/moon.jpg',
    sunlight: 1.0,
    description: 'Our closest neighbor, about 3 days away. Your crew lands near the south pole, where some craters have not seen sunlight in billions of years. Hidden inside them: frozen water.'
  },
  {
    id: 'mars', available: true,
    name: 'MARS',
    title: 'The Last River',
    difficulty: 'Medium',
    image: 'assets/images/mars.jpg',
    sunlight: 0.43,
    description: 'Billions of years ago, a river filled Jezero Crater with water. Your crew searches its rocks for signs of ancient life. Mars gets only about 43% of the sunlight Earth gets.'
  },
  {
    id: 'europa', available: false,
    name: 'EUROPA',
    title: 'The Hidden Ocean',
    difficulty: 'Hard',
    image: 'assets/images/jupiter.jpg',
    sunlight: 0.04,
    description: "One of Jupiter's moons. Under its ice hides a salty ocean with about twice as much water as all of Earth's oceans. Brutal cold, strong radiation and almost no sunlight."
  }
];

/* =====================================================
   CREW
   ===================================================== */
const PLAYER_STYLE = [
  { shape: '▲', color: '#38bdf8', keys: 'Q · W · E' },
  { shape: '■', color: '#f59e0b', keys: 'C · V · B' },
  { shape: '●', color: '#a78bfa', keys: 'I · O · P' },
  { shape: '◆', color: '#22c55e', keys: '← · ↓ · →' }
];

// Control Hydrus gives orders by station during emergencies.
// With fewer than 4 players, some players run more than one station.
const STATIONS = [
  { id: 'power',   name: 'POWER',   color: '#f59e0b' },
  { id: 'comms',   name: 'COMMS',   color: '#a78bfa' },
  { id: 'science', name: 'SCIENCE', color: '#22c55e' },
  { id: 'safety',  name: 'SAFETY',  color: '#38bdf8' }
];

/* =====================================================
   HANGAR
   Game numbers are tuned for play. Real NASA facts are in the texts.
   ===================================================== */
const BUDGET = 100;              // millions of dollars
const FUEL_COST_PER_10 = 1;      // $1M for every 10% of fuel
const BASE_POWER_USE = 40;       // watts the ship always needs (computers, life support)

// payload = kg of equipment it can carry. days = days to explore
// dryMass, fuelMax and isp are used for the rocket equation (Δv).
const ROCKETS = [
  { id: 'light',  name: 'LIGHT',  payload: 60,  cost: 20, days: 10, dryMass: 30, fuelMax: 300, isp: 450, height: 48 },
  { id: 'medium', name: 'MEDIUM', payload: 80,  cost: 30, days: 7,  dryMass: 40, fuelMax: 390, isp: 450, height: 62 },
  { id: 'heavy',  name: 'HEAVY',  payload: 100, cost: 40, days: 5,  dryMass: 55, fuelMax: 500, isp: 450, height: 76 }
];

// weight kg · cost $M · power W (+ makes, − uses). solarPower is multiplied by the sunlight.
// max = how many you can carry
const EQUIPMENT = [
  { id: 'solar',   tag: 'SOL', cat: 'power',   name: 'Solar panels',      weight: 15, cost: 10, solarPower: 100, max: 3 },
  { id: 'rtg',     tag: 'NUC', cat: 'power',   name: 'Nuclear generator', weight: 30, cost: 30, power: 110 },
  { id: 'battery', tag: 'BAT', cat: 'power',   name: 'Battery',           weight: 10, cost: 5,  power: 0, backup: 2, max: 3 },
  { id: 'shield',  tag: 'SHD', cat: 'support', name: 'Radiation shield',  weight: 20, cost: 15, power: 0 },
  { id: 'repair',  tag: 'KIT', cat: 'support', name: 'Repair kit',        weight: 10, cost: 5,  power: 0, max: 3 },
  { id: 'antenna', tag: 'ANT', cat: 'comms',   name: 'High-gain antenna', weight: 8,  cost: 10, power: -40 },
  { id: 'camera',  tag: 'CAM', cat: 'science', name: 'Camera',            weight: 5,  cost: 5,  power: -10 },
  { id: 'lab',     tag: 'LAB', cat: 'science', name: 'Laboratory',        weight: 15, cost: 20, power: -60 }
];
const CATEGORY_COLORS = { power: '#f59e0b', support: '#38bdf8', comms: '#a78bfa', science: '#22c55e' };

// data points per sample, by science instruments on board
const DATA_PER_SAMPLE = { none: 3, camera: 6, lab: 12, both: 15 };

/* ---------- What each destination is like ----------
   dvNeeded : Δv (km/s) the rocket needs to get there (game value)
   recs     : Control Hydrus recommendation for each item
              yes = recommended · best = best for science · opt = optional · no = not useful
   hazards  : what can go wrong. coveredBy = any of these items protects you
              ("solar:2" means 2 solar panels)
   --------------------------------------------------- */
const PLANET_INFO = {
  moon: {
    dvNeeded: 3.2, goal: 'Find ice in a dark crater',
    env: [['SUN', '100%'], ['TEMP', '−173 to 127 °C'], ['RADIATION', 'High'], ['SIGNAL', '1.3 s'], ['GRAVITY', '0.17 g']],
    recs: {
      solar:   ['yes',  'Full sunlight on the Moon: 100 W per panel.'],
      rtg:     ['opt',  'Works, but heavy and expensive for the Moon.'],
      battery: ['yes',  'A lunar night lasts about 14 Earth days.'],
      shield:  ['opt',  'No air or magnetic field: some radiation.'],
      repair:  ['yes',  'Lunar dust is sharp like glass and wrecks gear.'],
      antenna: ['opt',  'Earth is only 1.3 light-seconds away.'],
      camera:  ['opt',  'Basic data. Good if the budget is tight.'],
      lab:     ['best', 'Drill into the ice of the dark crater.']
    },
    hazards: [
      { name: 'Lunar night (14 Earth days)', level: 4, coveredBy: ['battery', 'rtg'], ok: 'Power stored for the dark', no: 'Nothing to survive the night', note: 'Solar panels stop working at night.' },
      { name: 'Sharp lunar dust', level: 3, coveredBy: ['repair'], ok: 'Repair kit on board', no: 'No repair kit', note: 'Dust scratches seals and clogs filters.' },
      { name: 'Radiation (no atmosphere)', level: 3, coveredBy: ['shield'], ok: 'Radiation shield on board', no: 'No shield', note: 'Emergencies hit twice as hard without it.' },
      { name: 'Power from the Sun', level: 2, coveredBy: ['solar', 'rtg'], ok: 'Power source on board', no: 'No power source', note: 'The Moon gets full sunlight by day.' },
      { name: 'Signal to Earth', level: 1, coveredBy: ['always'], ok: 'Earth is close: 1.3 s', no: 'Earth is close: 1.3 s', note: 'Fast messages, help is near.' },
      { name: 'Science return', level: 2, coveredBy: ['lab'], ok: 'Laboratory: 12 pts per sample', no: 'No laboratory: fewer data points', note: 'A laboratory doubles your data.' }
    ]
  },
  mars: {
    dvNeeded: 4.6, goal: 'Analyze the "leopard spots" rock',
    env: [['SUN', '43%'], ['TEMP', 'about −63 °C'], ['DUST', 'Global storms'], ['SIGNAL', '3–22 min'], ['GRAVITY', '0.38 g']],
    recs: {
      solar:   ['opt',  'Mars gets 43% of our sunlight, and dust covers panels.'],
      rtg:     ['yes',  'Works through dust storms, like Curiosity and Perseverance.'],
      battery: ['yes',  'Stores energy for dusty days and cold nights.'],
      shield:  ['opt',  'Thin air gives a little protection.'],
      repair:  ['yes',  'Storms and a rough landing will cause damage.'],
      antenna: ['yes',  'Signals take up to 22 min, and Mars can hide behind the Sun.'],
      camera:  ['opt',  'Basic data. Good if the budget is tight.'],
      lab:     ['best', 'Analyze the rocks of the ancient river.']
    },
    hazards: [
      { name: 'Global dust storms', level: 4, coveredBy: ['rtg', 'battery'], ok: 'Power that survives the storm', no: 'Only solar power', note: 'In 2018 a dust storm ended the Opportunity rover.' },
      { name: 'Weak sunlight (43%)', level: 3, coveredBy: ['rtg', 'solar:2'], ok: 'Enough power source', no: 'Not enough power source', note: 'One panel gives only 43 W on Mars.' },
      { name: 'Cold: about −63 °C', level: 3, coveredBy: ['rtg', 'battery'], ok: 'Heat and backup power', no: 'Gear may freeze', note: 'Batteries and electronics need warmth.' },
      { name: 'Signal delay and blackout', level: 3, coveredBy: ['antenna'], ok: 'High-gain antenna on board', no: 'No antenna', note: 'Mars can hide behind the Sun for weeks.' },
      { name: 'Hull damage', level: 3, coveredBy: ['repair'], ok: 'Repair kit on board', no: 'No repair kit', note: 'The landing alone is "7 minutes of terror".' },
      { name: 'Science return', level: 2, coveredBy: ['lab'], ok: 'Laboratory: 12 pts per sample', no: 'No laboratory: fewer data points', note: 'A laboratory doubles your data.' }
    ]
  },
  europa: {
    dvNeeded: 5.6, goal: 'Sample the water plume',
    env: [['SUN', '4%'], ['TEMP', '−160 °C'], ['RADIATION', 'Extreme'], ['SIGNAL', '33–53 min'], ['GRAVITY', '0.13 g']],
    recs: {
      solar:   ['no',   'Only 4% sunlight: 100 W on Earth, 4 W on Europa.'],
      rtg:     ['yes',  'The only steady power this far from the Sun.'],
      battery: ['opt',  'Backup if the generator fails. Weak alone in the cold.'],
      shield:  ['yes',  'Jupiter blasts Europa with extreme radiation.'],
      repair:  ['yes',  'Hard mission: expect damage from 4 emergencies.'],
      antenna: ['yes',  'Your signal takes 33 to 53 min to reach Earth.'],
      camera:  ['opt',  'Basic data. Good if the budget is tight.'],
      lab:     ['best', 'Analyzes the water plume from the hidden ocean.']
    },
    hazards: [
      { name: 'Radiation from Jupiter', level: 5, coveredBy: ['shield'], ok: 'Radiation shield on board', no: 'No shield', note: 'Without it, every emergency hits twice as hard.' },
      { name: 'Almost no sunlight', level: 5, coveredBy: ['rtg'], ok: 'Nuclear generator on board', no: 'No nuclear generator', note: 'Solar panels give only 4 W here.' },
      { name: 'Cold: about −160 °C', level: 4, coveredBy: ['rtg'], ok: 'Generator heat keeps gear alive', no: 'Gear will freeze', note: 'Batteries alone would freeze.' },
      { name: 'Signal delay to Earth', level: 4, coveredBy: ['antenna'], ok: 'High-gain antenna on board', no: 'No antenna', note: 'You have to solve problems on your own.' },
      { name: 'Hull damage', level: 3, coveredBy: ['repair'], ok: 'Repair kit on board', no: 'No repair kit', note: 'Damage from emergencies will add up.' },
      { name: 'Science return', level: 2, coveredBy: ['lab'], ok: 'Laboratory: 12 pts per sample', no: 'No laboratory: fewer data points', note: 'A laboratory doubles your data.' }
    ]
  }
};

/* ---------- Hangar tour by Control Hydrus ----------
   target: the part of the hangar that lights up (null = whole hangar)
   {Planet} = Moon, Mars or Europa · {place} = the Moon, Mars or Europa
   --------------------------------------------------- */
const HANGAR_TOUR = [
  { target: null,
    text: "Welcome to the hangar, crew! This is where we build our mission to {Planet}. Let me show you around. It only takes a minute." },
  { target: '#m-budget, #m-weight, #m-power, #m-data',
    text: "These bars are our limits. Budget: we only have $100M. Weight: what the rocket can carry. Power: energy we make vs. energy we use. If a bar turns red, something's wrong. Data: how much science we'll send home." },
  { target: '#p-rocket',
    text: "Step 1: pick your rocket. Bigger rockets carry more, but they cost more and take longer to arrive, so you'll have fewer days to explore." },
  { target: '.hg-fuel',
    text: "Now the fuel. Move the slider until your Δv is a bit higher than what {Planet} needs. Too little and we won't make it. Too much and we waste money. And remember: the heavier the rocket, the more fuel it needs!" },
  { target: '#p-equip',
    text: "Step 2: load your equipment. Click an item to add it. I'll give you tips for {place}, the world you will be visiting: green means recommended, red means it won't help here." },
  { target: '.hg-bay',
    text: "Here you can watch your rocket come together. Every item you add shows up in the payload bay, and the tank shows your fuel. The red line is the minimum to reach {place}." },
  { target: '#p-hazards',
    text: "These are the dangers waiting for us on {Planet}. A green check means your equipment protects you. A red cross means you're exposed. Try to cover the biggest ones!" },
  { target: '#p-crew',
    text: "Each of you runs a station: Power, Comms, Science or Safety. During emergencies I'll call your station by name, so keep your fingers on your keys!" },
  { target: '.hg-launch',
    text: "This meter shows our chance to find the water. When you're ready, press LAUNCH. Don't worry: you'll see a full summary before liftoff." },
  { target: '#hg-help',
    text: "If you ever need help, press the ? button. Now let's build this mission, team!" }
];

const REC_LABELS = { yes: '★ RECOMMENDED', best: '★ BEST FOR SCIENCE', opt: '○ OPTIONAL', no: '✗ NOT USEFUL HERE' };

const DESTINATION_GUIDE = 'Mars is ready for launch. The Moon and Europa are coming soon!';

/* ---------- Credits (add the NASA image IDs you used) ---------- */
const CREDITS = [
  'Hydrus 2040: Expedition in search of a blue footprint. Made for the NASA Space Apps Challenge 2026.',
  'Title background: Milky Way from the International Space Station, Expedition 44. Image iss044e045215, NASA.',
  'Moon, Mars and Jupiter photos: NASA (add image IDs).',
  'Astronaut photos: NASA (add image IDs). Mission patches removed.',
  'Hangar background: NASA artist illustration (add image ID).',
  'Mars landscapes in the level are placeholders: replace them with NASA panoramas (Perseverance, Jezero Crater).',
  'Intro drawings, code and part of the texts were made with help from AI (Claude).',
  'Fonts: Orbitron and Exo 2 (SIL Open Font License).'
];
