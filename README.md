# RHOOS CITY — District One

A playable single-city economic simulation inspired by the constraints and
visual language of late-1980s Japanese computer games.

You arrive in District One with ¥3,200. Walk the streets, accept jobs, earn
wages from real business treasuries, buy property, upgrade companies, and
change the programmable rules that connect the city's economy.

## Play

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address shown in the terminal.

## Controls

- `WASD` or arrow keys: walk
- `E`: enter a nearby building or begin an accepted shift
- `J`: open the selected building's jobs
- `R`: open the city rule matrix
- `Space`: pause or resume
- Map click: inspect a building
- Touch controls appear on narrow screens

## Included systems

- A hand-built 20-location city with industrial, commercial, residential,
  civic, finance, utility, entertainment, and transport districts
- Animated cars, signal-controlled intersections, roads, and traffic flow
- Twenty named citizens with home, commute, work, shopping, and leisure
  schedules
- A day/night cycle with three simulation speeds
- A connected ore → steel → electronics → freight → market economy
- Eighteen paid jobs with time, energy, and reputation requirements
- Business inventory, workers, demand, output, cash, and property values
- Player property ownership, dividends, and business upgrades
- Six live `IF → THEN` automation rules with citywide effects
- Local save/restore and auto-save
- Keyboard, pointer, and touch controls

## Project structure

- `app/rhoos-city.tsx`: game loop, rendering, interactions, and interface
- `app/game-data.ts`: city map, buildings, jobs, NPCs, and automation rules
- `app/globals.css`: visual system, responsive layout, and pixel-era styling
- `tests/rendered-html.test.mjs`: production-render smoke tests

## Verify

```bash
npm run build
npm test
```

The web build targets the bundled vinext/Cloudflare runtime. Player state is
stored locally in the browser; no account or database is required.
