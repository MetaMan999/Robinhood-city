# RHOOS CITY — Player & Career Engine

RHOOS CITY is a playable first-person economic RPG rendered in real-time 3D,
with an original procedural soundtrack and a live programmable operations layer
called HookTech. The v0.4 player engine adds persistent character customization,
career tracks, profession bonuses, experience levels, work streaks, and lifetime
earnings.

Walk the streets of District One, follow traffic and citizens, take verified
jobs, earn wages, purchase businesses, and install hooks that react to the
city's inventory, sales, traffic, shifts, revenue, and power demand.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by the development server.

## Controls

- `WASD`: move and strafe
- Mouse: look around after clicking the game
- Arrow keys: look and move
- `Shift`: sprint
- `E` or `F`: interact with a nearby building
- `Space`: hit the timing window during work shifts
- `J`: city jobs channel
- `P`: character and career engine
- `H`: HookTech matrix
- `M`: district map
- `Space`: pause when no work console is open
- `Esc`: release mouse or close a panel

Touch controls appear automatically on narrow screens.

## Live systems

- Three.js WebGL renderer with modeled buildings, vehicles, citizens,
  streetlights, traffic signals, weather, shadows, fog, and neon signs
- First-person movement, looking, sprint energy, collision, and targeting
- Twenty city locations across industry, commerce, utilities, finance,
  transport, housing, government, and entertainment
- Twenty scheduled citizens and twenty-six moving vehicles
- Traffic density, road signals, weather, day/night, fog, and rain
- Ore → steel → electronics → freight → retail production chain
- Eighteen verified city jobs with wages, reputation, and business output
- Timing-based work console that turns every shift into a skill challenge
- Character studio with editable name, call sign, skin, hair, jacket, and
  wearable tech colors
- Five switchable career tracks with matched job recommendations, wage bonuses,
  experience, titles, levels, work streaks, and lifetime earnings
- First-person hands and clothing that update with the saved character
- Contract management for accepting, routing to, working, and releasing jobs
- Original generative city soundtrack with melody, bass, percussion, ambience,
  interaction sounds, mute, and volume controls
- Property ownership, dividends, upgrades, and automatic local saving
- Six installable HookTech modules with real simulation effects:
  - Supply Router
  - Dynamic Market
  - Shift-to-Earn
  - Traffic Oracle
  - Treasury Split
  - Grid Guard
- Live execution blocks and HookTech packet monitor
- Full district map, building terminals, job board, and mobile controls

## Project structure

- `app/rhoos-live-city.tsx`: player loop, economy, UI, jobs, property, and
  HookTech runtime
- `app/rhoos-three-engine.ts`: Three.js city renderer, real 3D models, lights,
  traffic, citizens, weather, and first-person camera
- `app/rhoos-sound-engine.ts`: original procedural soundtrack and game sounds
- `app/game-data.ts`: city buildings, job definitions, citizens, vehicles, and
  hook modules
- `app/globals.css`: responsive game interface and 1980s PC visual system
- `public/og.png`: project social preview card
- `tests/rendered-html.test.mjs`: production-render smoke tests

## Verify

```bash
npm run build
npm test
```

Player progress is stored locally in the browser; no account or external
database is required.
