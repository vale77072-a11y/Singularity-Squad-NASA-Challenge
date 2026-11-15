# Hydrus 2040: Follow the water

A space mission design game for the NASA Space Apps Challenge 2026 ("Space Mission Design Game").

## How to play it on your computer
Open the folder and double-click `index.html`. It opens in your browser. No installation needed.
Tip: press F11 for full screen.

## What is built so far
1. Title screen (animated title, NASA background photo)
2. Intro comic (6 panels with Control Hydrus, your mission guide)
3. Choose your destination (Moon, Mars, Europa with rotating NASA photos)
4. Crew window (how many astronauts, and their names)
5. Hangar: rocket, fuel (rocket equation, Δv), equipment with recommendations for each planet,
   hazards, crew stations, mission readiness
6. Launch summary window (confirm launch or go back)

Next: the journey, emergencies, exploration and final report.

## Where things are
| What | File |
|---|---|
| All texts and numbers (intro, planets, rockets, equipment, hazards) | `js/data.js` |
| Colors, sizes, animations | `css/style.css` |
| Screens (HTML) | `index.html` |
| Crew window | `js/crew.js` |
| Hangar logic | `js/hangar.js` |
| Images | `assets/images/` |

To change an image, save the new one in `assets/images/` with the **same name**.

## Credits
- Images: NASA (see the Credits button in the game). NASA logos are not used.
- Fonts: Orbitron and Exo 2 (SIL Open Font License).
- Code and intro drawings made with help from AI (Claude).
- Real facts (sunlight, temperatures, signal delay, radiation) come from NASA; game numbers are tuned for play.
