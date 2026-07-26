# RHOOS CITY — First Person HookTech

RHOOS CITY is a playable first-person economic city prototype with a live
programmable operations layer called HookTech.

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
- `J`: city jobs channel
- `H`: HookTech matrix
- `M`: district map
- `Space`: pause
- `Esc`: release mouse or close a panel

Touch controls appear automatically on narrow screens.

## Live systems

- Street-level pseudo-3D renderer with perspective buildings and signs
- First-person movement, looking, sprint energy, collision, and targeting
- Twenty city locations across industry, commerce, utilities, finance,
  transport, housing, government, and entertainment
- Twenty scheduled citizens and twenty-six moving vehicles
- Traffic density, road signals, weather, day/night, fog, and rain
- Ore → steel → electronics → freight → retail production chain
- Eighteen verified city jobs with wages, reputation, and business output
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

- `app/rhoos-live-city.tsx`: first-person renderer, simulation, economy, UI,
  jobs, property, and HookTech runtime
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
