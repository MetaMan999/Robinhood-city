# RHOOS CITY — Living Economy RPG

RHOOS CITY is a playable driving, third-person living-city trading card game.
Explore a neon New York-inspired district on foot or in four enterable city
cars, talk to scheduled residents, navigate with a permanent minimap, use a
free origin character or verify an ERC-721 character NFT, build a
work deck, win corporate job encounters, rise from intern to District Boss,
own businesses, trade functional assets, join cooperatives, and automate the
economy with HookTech.

Version 0.11 adds a productive broker economy and civic progression. Players
can clock in for time-limited work bonuses, accumulate verified work and output
units, route transparent marketplace fees into reserve/cooperative/city ledgers,
track a player-bound economic vault, and follow an explicit readiness path
toward externally funded settlement. High-reputation players who complete the
civic requirements can run for mayor and enact policies affecting wages,
traffic, vehicle value, and local-business demand.

Version 0.10 added the RHOOS Exchange: twelve codified assets with limited
supply and real city functions, demand-driven live values, a persistent
portfolio, buy/sell trades, simulated operating yields, three player
cooperatives with shared earnings, and player-controlled X cooperation links.

Version 0.9 added a second, street-level gameplay layer with four selectable
spawn neighborhoods, walk-up job contacts, destination beacons, repeatable
courier, mechanic, market, and station work, direct wage payouts, named street
signs, brighter business signs, and a live traffic-signal network.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address printed by the development server.

## Controls

- `WASD`: move and strafe
- Arrow keys: orbit the follow camera
- `Shift`: sprint
- `E` or `F`: interact, talk to a nearby citizen, enter any nearby city car, or exit when stopped
- Gamepad left stick: camera-relative movement or vehicle steering
- Gamepad right stick: orbit the third-person camera
- Gamepad `A`: interact; right/left triggers: drive and brake; `B`: handbrake;
  right bumper: boost
- Driving `W/S`: accelerate, brake, and reverse
- Driving `A/D`: steer
- Driving `Shift`: boost
- Driving `Space`: handbrake
- Driving `R`: recover the car to Central Loop
- `C`: NFT character and card deck
- `J`: city jobs channel
- `P`: character and career engine
- `H`: HookTech matrix
- `V`: RHOOS Exchange, portfolio, and cooperatives
- `M`: district map
- `Space`: pause
- `Esc`: release mouse or close a panel

## TCG and career systems

- Three prototype v4 Hook Pass assets—Runner, Worker, and Founder—that are
  purchased with device-local city cash and become the player’s entry identity
- Each Hook Pass binds a unique serial, installs its matching city rule, and
  unlocks the corresponding live HookTech card
- Free city-origin character, plus user-triggered ERC-721 ownership verification
- Read-only wallet integration using the EIP-1193 provider interface
- Sixteen work cards across movement, industry, markets, finance, and HookTech
- Persistent unique serial, XP, plays, and wins for every collected card
- Live card modifiers driven by traffic, grid load, demand, city output, and
  installed HookTech modules
- Six-to-ten-card deck builder and three-round job encounters
- Device-local RHO credits, rating, collection unlocks, and career progression
- City Value score based on rarity, verified play, mastery, wins, live
  conditions, and corporate rank
- Ten text-only prototype workplaces based on current large public companies
- Five-rank company ladder: City Intern, Associate, Manager, Director, and
  District Boss
- Company-HQ job alignment, promotions, and in-game wage bonuses

## Living economy systems

- Clock In participation rounds with useful-work bonuses and shift streaks
- Player-bound broker vault tracking work, output, assets, fees, and distributions
- Transparent 2.5% simulated market fee split across reserve, cooperative, and
  city-operations ledgers
- Productive-power scoring based on work, output, reputation, assets, and participation
- Five-stage real-value readiness model with external withdrawals visibly locked
- Civic ladder from Resident to Mayoral Candidate and Mayor
- Functional mayor ordinances for jobs, transit, and local enterprise
- Twelve codified assets across vehicles, businesses, property, contracts,
  utilities, tools, and v4 Hook modules
- Limited supply, unique serials, city functions, market asks, and
  demand-responsive live values
- Persistent player portfolio with acquisition and sale history
- Simulated operating yields paid every thirty city minutes
- Three cooperatives for delivery, industry, and property/finance players
- Cooperative treasury contributions and shared member earnings
- Player-controlled X Web Intents for discussing assets and coordinating work
- Clear prototype boundary: all current value is device-local game state

## Driving systems

- Four parked, enterable city cars: RHO-86, Metro GT, Cab-7, and Nightline
- Generous GTA-like approach targeting with one-button entry and safe low-speed exit
- Smooth acceleration, coasting drag, braking, reverse, steering interpolation,
  boost, and handbrake
- Collision response, vehicle condition, odometer, gear, and MPH telemetry
- Dynamic chase camera with speed-sensitive distance, look-ahead, smoothing,
  and field of view
- Modeled bodywork, glass, grille, lights, wheels, rims, and nighttime headlamps
- Procedural engine tone that responds continuously to vehicle speed
- Touch throttle, steering, reverse, handbrake, and exit controls

## Third-person control systems

- Visible player character with saved skin, jacket, and tech colors
- Animated walking, running, limbs, shadow, badge, and direction changes
- Camera-relative WASD movement: forward always follows the visible camera
- Smooth acceleration and deceleration instead of abrupt grid-like movement
- Soft character turning that follows the movement direction
- N64-style elevated follow camera with smoothing and sprint zoom
- Keyboard, touch, and standard browser gamepad support

## City-life systems

- Four on-foot spawn points: Central Station, City Hall Plaza, Harbor Loop, and
  West Works
- Walk-up street jobs with visible 3D contacts and destination beacons
- Repeatable courier, mechanic, market-stock, and commuter-guide work with
  immediate city-cash wages, reputation, and career XP
- Mechanic work restores vehicle condition
- Twenty scheduled residents who can be approached and spoken to
- Contextual dialogue about jobs, traffic, businesses, property, and nightlife
- Permanent minimap with player heading, roads, buildings, enterable cars, and
  active-job destination
- Live street and district names while walking or driving
- Interaction priority that naturally selects a nearby car, person, or building
- Named intersection signs, two-sided illuminated business signs, traffic
  lights, and a live four-corridor signal network display

Prototype company names are used as text-only roleplay workplaces. The game is
not affiliated with, endorsed by, or sponsored by those companies or S&P Dow
Jones Indices. It contains no live stock prices or investment products.

## Existing living-city systems

- Three.js WebGL renderer with modeled buildings, vehicles, citizens,
  streetlights, traffic signals, weather, shadows, fog, and neon signs
- Twenty locations, twenty scheduled citizens, and twenty-six moving vehicles
- Traffic, day/night, weather, economy, production, jobs, property ownership,
  business upgrades, and six programmable HookTech modules
- Original generative city soundtrack and responsive desktop/mobile interface
- Automatic browser-local saving

## Project structure

- `app/rhoos-live-city.tsx`: player loop, TCG, wallet UI, economy, careers,
  jobs, property, and HookTech runtime
- `app/tcg-data.ts`: card definitions and starter collection
- `app/corporate-data.ts`: prototype corporate workplaces and role ladder
- `app/economy-data.ts`: codified functional assets and cooperative definitions
- `app/value-economy.ts`: fees, vault accounting, Clock In, and value-bridge formulas
- `app/city-governance.ts`: mayor requirements, civic ranks, and city policies
- `app/nft-wallet.ts`: read-only EIP-1193/ERC-721 ownership verification
- `app/rhoos-three-engine.ts`: Three.js living-city renderer
- `app/rhoos-sound-engine.ts`: procedural soundtrack and game sounds
- `app/game-data.ts`: buildings, jobs, citizens, vehicles, and hooks
- `app/globals.css`: responsive game and TCG interface
- `public/og.png`: generated project cover

## Verify

```bash
npm test
```

Progression, RHO credits, simulated reserve balances, distributions, and assets
are device-local prototype game state with no cash value. Real redemption
requires external funding, signed identity, audited contracts, custody, and
appropriate legal, tax, and jurisdictional controls. The game never requests
NFT transfers, approvals, minting, or automatic spending.
