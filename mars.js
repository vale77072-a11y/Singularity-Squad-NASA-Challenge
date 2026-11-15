/* =====================================================
   HYDRUS 2040 — MARS MISSION (level data)
   This file is the MODEL for the Moon and Europa:
   copy it, rename it (moon.js / europa.js) and change ONLY
   the text between quotes and the numbers.
   Do not rename anything before a colon.

   Step types:
     walk  : the crew walks by itself (spectator). Optional sample at the end.
     event : an emergency. kind = decision | minigame | mixed
   Effects: hull, energy, o2, kits, data  (negative = lose, positive = win)
   Stations: power, comms, science, safety
   Minigames: sequence (press the keys shown, in order)
              timing   (press middle key when the marker is in the green zone)
              hold     (keep the middle key pressed until the bar is full)
   ===================================================== */
const MISSIONS = window.MISSIONS || {};
window.MISSIONS = MISSIONS;

MISSIONS.mars = {
  name: 'MARS',
  title: 'The Last River',
  place: 'Jezero Crater',
  walkImage: 'assets/images/mars-walk.jpg',   // wide landscape for the walking scene
  povImage: 'assets/images/mars-pov.jpg',     // landscape seen through the helmet visor (use a NASA panorama)
  landingAnimation: null,                     // put a video here later, e.g. 'assets/animations/mars-landing.mp4'
  goalName: 'the "leopard spots" rock',
  energyPerWalk: 4,                           // energy used on every walk

  // Points on the mission map (x, y in % of the map)
  map: [
    { x: 24, y: 70, icon: '⌂', color: '#38bdf8', label: 'HYDRUS BASE', text: 'Our home in Jezero Crater. We start and end here.' },
    { x: 36, y: 50, icon: 'A', color: '#22c55e', label: 'SAMPLE A · DELTA', text: 'Where the ancient river entered the lake. Mud layers can trap signs of life.' },
    { x: 48, y: 40, icon: '!', color: '#ef4444', label: 'ROCKSLIDE', text: 'A risky pass. The team will have to choose a route.' },
    { x: 55, y: 62, icon: 'B', color: '#22c55e', label: 'SAMPLE B · LAKE BED', text: 'The floor of a lake that dried up billions of years ago.' },
    { x: 66, y: 32, icon: '!', color: '#ef4444', label: 'DUST STORM ZONE', text: 'Storms can cover the Sun for days. Power will matter here.' },
    { x: 74, y: 58, icon: 'C', color: '#22c55e', label: 'SAMPLE C · CRATER RIM', text: 'Old rocks thrown out by the impact that made the crater.' },
    { x: 82, y: 38, icon: '★', color: '#facc15', label: 'LEOPARD SPOTS ROCK', text: 'GOAL: a rock from the ancient river with dark rings and spots.' }
  ],

  steps: [
    { type: 'walk', seconds: 8,
      line: "Day 1 on Mars. Hydrus Base is set up. Let's walk to the old river delta.",
      sample: 'Sample A collected at the river delta!' },

    { type: 'event', id: 'rockslide', kind: 'decision',
      alert: 'ROCKSLIDE BLOCKS THE PATH',
      say: 'A rockslide! Vote with your keys: left, middle or right.',
      options: [
        { label: 'CLIMB THE RIDGE', text: 'Fast, but sharp rocks can cut a suit.', effects: { hull: -20 },
          result: 'We climbed the ridge. The rocks scratched our suits.' },
        { label: 'DETOUR THROUGH THE DUNES', text: 'Safe, but the walk is longer.', effects: { energy: -15 },
          result: "The dunes took longer, but nobody got hurt." },
        { label: 'CLEAR THE ROCKS', text: 'Use a repair kit as tools to open the path.', effects: { kits: -1 }, needsKit: true,
          result: 'We cleared the path with the tools from a repair kit.' }
      ],
      nasa: { text: "In 2013, sharp rocks punched holes in Curiosity's wheels. NASA started planning smoother routes around rough terrain.",
              source: 'NASA – Curiosity rover', url: 'https://science.nasa.gov/mission/msl-curiosity/' } },

    { type: 'walk', seconds: 10,
      line: 'Heading to the old lake bed. Keep an eye on your suit readings.',
      sample: 'Sample B collected at the lake bed!' },

    { type: 'event', id: 'o2filter', kind: 'minigame', station: 'safety', game: 'sequence', length: 5, seconds: 9,
      alert: 'O₂ FILTER FAILURE',
      say: 'Your oxygen filter is clogging! Repeat the sequence, fast!',
      win: { effects: {}, result: 'Filter clean. No oxygen lost!' },
      lose: { effects: { o2: -1 }, result: 'We had to swap the filter and lost 1 oxygen tank.' },
      nasa: { text: 'In 1970, the Apollo 13 crew built a CO₂ filter adapter from spare parts so they could keep breathing on the way home.',
              source: 'NASA – Apollo 13', url: 'https://www.nasa.gov/mission/apollo-13/' } },

    { type: 'walk', seconds: 10,
      line: 'Dust on the horizon... and it is growing fast.' },

    { type: 'event', id: 'storm', kind: 'decision',
      alert: 'GLOBAL DUST STORM',
      say: 'A dust storm is covering the Sun! How do we keep going?',
      options: [
        { label: 'RUN ON NUCLEAR POWER', text: 'The generator works without sunlight.', effects: { energy: -5 }, needs: 'rtg',
          result: 'The nuclear generator kept us running. Great call in the hangar!' },
        { label: 'SHELTER AND WAIT', text: 'Safe, but the suits drain power while we wait.', effects: { energy: -25 },
          result: 'We waited out the storm. It drained a lot of power.' },
        { label: 'KEEP WALKING', text: 'No waiting, but the storm will hit hard.', effects: { hull: -25 },
          result: 'We pushed through. The storm battered our suits.' }
      ],
      nasa: { text: 'In 2018, a dust storm covered all of Mars and blocked the Sun for weeks. The solar-powered rover Opportunity never woke up again.',
              source: 'NASA – Opportunity rover', url: 'https://science.nasa.gov/mission/mer-opportunity/' } },

    { type: 'walk', seconds: 10,
      line: 'The storm is gone. Next stop: the crater rim.',
      sample: 'Sample C collected at the crater rim!' },

    { type: 'event', id: 'antenna', kind: 'mixed', station: 'comms', game: 'timing', hits: 3, seconds: 10,
      alert: 'ANTENNA OUT OF ALIGNMENT',
      say: 'The antenna is off! Use a repair kit, or try to align it by hand?',
      safe: { label: 'USE 1 REPAIR KIT', text: 'Safe. The antenna is fixed for sure.', effects: { kits: -1 }, result: 'Repair kit used. The antenna is fixed.' },
      risky: { label: 'ALIGN BY HAND (MINIGAME)', text: 'Free if it works, but data is lost if it fails.' },
      win: { effects: { data: 6 }, result: 'Signal locked! We kept our repair kits and even sent extra data.' },
      lose: { effects: { data: -10 }, result: 'We lost the signal for a while. Some data was lost.' },
      nasa: { text: "Most of Perseverance's data reaches Earth relayed by orbiters, such as NASA's Mars Reconnaissance Orbiter.",
              source: 'NASA – Mars Reconnaissance Orbiter', url: 'https://science.nasa.gov/mission/mars-reconnaissance-orbiter/' } },

    { type: 'walk', seconds: 10,
      line: 'There it is: the "leopard spots" rock. This is what we came for.' },

    { type: 'event', id: 'leopard', kind: 'minigame', station: 'science', game: 'hold', holdSeconds: 3, seconds: 10, goal: true,
      alert: 'GOAL: THE "LEOPARD SPOTS" ROCK',
      say: 'Hold your middle key to drill a core sample. Steady...',
      win: { effects: {}, result: 'Core sample collected! It could hold signs of ancient life.' },
      lose: { effects: {}, result: 'The drill slipped. We only got a small piece.' },
      nasa: { text: 'In 2024, Perseverance found a rock called "Cheyava Falls" in Jezero Crater. In 2025 NASA called it a potential biosignature: it still needs to be confirmed.',
              source: 'NASA – Perseverance rover', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/' } },

    { type: 'walk', seconds: 10,
      line: 'Back to Hydrus Base to send everything home.' }
  ],

  // Final story text
  winTitle: 'Founders of Hydrus Base',
  winText: 'Thanks to your crew, the first human base on Mars now has a date: 2045.',
  loseText: "You survived, but the water's secrets are still waiting.",
  realMission: 'Perseverance (NASA) has explored Jezero Crater since 2021, looking for signs of ancient life.'
};
