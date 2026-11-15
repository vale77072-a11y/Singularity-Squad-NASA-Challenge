# Hydrus 2040 · Mars: "The Last River" — mission script

This is the model for every planet. The Moon and Europa follow the same structure:
only texts, tasks, places and NASA files change.

## Controls (3 keys per player)

| Player | Left | Middle | Right |
|---|---|---|---|
| ▲ Player 1 | Q | W | E |
| ■ Player 2 | C | V | B |
| ● Player 3 | I | O | P |
| ◆ Player 4 | ← | ↓ | → |

- **Left / Right:** tap to walk that way, tap again to stop (no need to hold: avoids the keyboard limit).
- **Middle:** jump, or interact when something is nearby (pick up, deliver, use station, send data).
- Side view. The camera follows the group. Background moves in layers (parallax).
- You carry one sample at a time.
- In emergencies you first **walk to your station**, then do the task. The timer starts at the alarm.
- With fewer than 4 players, each one covers more than one station.

Task types: `sequence` (3 keys in order), `hold` (keep middle key pressed), `tap` (press middle key fast).

Each exploration day lasts about 90 seconds. The full game lasts 8–10 minutes.

---

## 0. Landing — Emergency 1: "Seven minutes of terror"
Inside the capsule (seated, no walking). Tasks go **in order**, one per player:
1. **Heat shield** (Power) — sequence
2. **Parachute** (Comms) — hold
3. **Retro-rockets** (Science) — tap
4. **Sky crane** (Safety) — hold

- Start: "Entering the atmosphere at 20,000 km/h. Earth can't help us now: their signal takes up to 22 minutes. It's all on you!"
- End: "Touchdown! Welcome to Jezero Crater."
- **NASA file:** Curiosity (2012) and Perseverance (2021) landed in about 7 minutes using a heat shield, a parachute, retro-rockets and a sky crane, all on their own.

## Day 1 — Set up the base (movement tutorial)
- Start: "Time to set up Hydrus Base. Walk with your left and right keys. Use your middle key to interact."
- First step: "That's it! Now go to your station."
- Tasks: Power turns on the generator · Comms raises the antenna · Science opens the lab · Safety checks the airlock.
- When all 4 are done: "Hydrus Base is online! Tomorrow, we explore."

## Day 2 — Exploration: samples A and B
- Start: "An ancient river once flowed into this crater. Find samples A and B, bring them to the lab, and send the data home."
- First pick-up: "Got one! Carry it back to the lab."
- Delivered: "Analyzing... +12 data points! Comms, send it from the antenna."
- Sending: "Transmitting to Earth..."
- 20 s left: "The Sun is setting. Get back inside before the cold night!"
- Rules: data per sample = 6 (camera), 12 (lab), 15 (both). Send data at the antenna (taps). High-gain antenna = 2× faster. Anyone still outside at night: small hull damage.

## Day 3 — Emergency 2: "Global dust storm"
- Alarm: "Dust storm incoming! Everyone back inside and to your stations, NOW!"
- All arrived: "Hold the line, crew!"
- Tasks at the same time (10 s): Power cleans the panels (tap) · Safety keeps the heater on (hold) · Comms secures the antenna (sequence) · Science protects the battery (hold).
- With nuclear generator: "The nuclear generator kept us running. Great call in the hangar!"
- Without it: "Without a nuclear generator, the storm drained our power." (−25 power)
- **NASA file:** In 2018, a dust storm covered all of Mars and ended the solar-powered Opportunity rover's mission.

## Day 4 — Exploration: sample C
- Start: "The storm is gone. Sample C is at the crater rim, the farthest point yet. Stay together!"
- Longer terrain, tighter clock. Bonus hidden sample if the team has little data.

## Day 5 — Emergency 3: "No signal"
- Alarm: "Mars just moved behind the Sun. No contact with Earth. We solve this alone!"
- Tasks at the same time: Comms re-aims the antenna (sequence) · Science saves the data (hold) · Safety checks systems (tap) · Power corrects navigation (sequence).
- With antenna: "The high-gain antenna found the signal again." Without it: "We lost energy trying to reconnect."
- No data can be sent this day (it is stored).
- **NASA file:** this is called a solar conjunction. It happens about every 2 years, and for about two weeks NASA stops sending commands to its Mars missions.

## Day 6 — GOAL: the "leopard spots" rock
- Start: "Today's the day. The 'leopard spots' rock is past the delta. It could hold signs of ancient life. This needs all four of you!"
- All at the rock: "Everyone in position. Let's do this carefully."
- Tasks at the same time: Safety anchors the drill (sequence) · Power powers it (tap) · Science drills (hold) · Comms takes photos (sequence).
- Then carry the rock core to the lab: +30 data.
- Without lab: "Our camera can take photos, but without a lab we can't confirm what's inside." (+10 only)
- **NASA file:** In 2024, Perseverance found a rock called "Cheyava Falls" in Jezero Crater. In 2025, NASA called it a potential biosignature. It still needs to be confirmed.

## Day 7 — Send everything home
- Start: "Last day! Send every data point home. Everyone can help at the antenna: tap your middle key together!"
- The more players tapping at the antenna, the faster the data goes.
- **Final report:** mass, budget, power, data, communications, time.
- Goal reached: title **"Founders of Hydrus Base"** + "Thanks to your crew, the first human base on Mars now has a date: 2045."
- Goal not reached: "You survived, but the water's secrets are still waiting."

## How you lose
- Hull or power reaches 0% → the mission ends.
- Day 7 ends without the goal → you survive, without the title.

---

## Data structure (copy for the Moon and Europa)

```js
MISSION_SCRIPT.mars = [
  { type: 'emergency', id: 'landing', order: 'sequence',
    intro: "Entering the atmosphere...", tasks: [ /* station, text, kind */ ],
    nasaFile: "..." },
  { type: 'setup', day: 1, intro: "Time to set up Hydrus Base...",
    stations: ['power', 'comms', 'science', 'safety'], done: "Hydrus Base is online!" },
  { type: 'explore', day: 2, intro: "An ancient river...",
    samples: [{ id: 'A', x: 300 }, { id: 'B', x: 1400 }],
    lines: { firstPickup: "Got one!", delivered: "+12 data points!", sunset: "The Sun is setting..." } },
  { type: 'emergency', id: 'dust', order: 'together', walkFirst: true /* ... */ },
  { type: 'explore', day: 4 /* ... */ },
  { type: 'emergency', id: 'conjunction', order: 'together', walkFirst: true /* ... */ },
  { type: 'goal', day: 6, rock: 'leopard', tasks: [ /* 4 steps */ ], nasaFile: "..." },
  { type: 'send', day: 7, intro: "Last day!..." }
];
```

**Rules to keep the structure:** only change text between quotes and numbers. Don't rename anything before a colon.
Don't delete commas, braces `{ }` or brackets `[ ]`. Every emergency has 4 tasks (power, comms, science, safety).
