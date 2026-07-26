export type CardSector =
  | "MOVE"
  | "INDUSTRY"
  | "MARKET"
  | "FINANCE"
  | "HOOK";

export type CityCard = {
  id: string;
  code: string;
  name: string;
  sector: CardSector;
  rarity: "COMMON" | "RARE" | "EPIC";
  cost: number;
  work: number;
  guard: number;
  description: string;
  flavor: string;
};

export const CITY_CARDS: CityCard[] = [
  {
    id: "district-runner",
    code: "MOV-01",
    name: "District Runner",
    sector: "MOVE",
    rarity: "COMMON",
    cost: 1,
    work: 3,
    guard: 1,
    description: "Gain +1 work when the active contract is in transport.",
    flavor: "Every shortcut is a small piece of city knowledge.",
  },
  {
    id: "freight-line",
    code: "MOV-04",
    name: "Freight Line",
    sector: "MOVE",
    rarity: "RARE",
    cost: 2,
    work: 5,
    guard: 1,
    description: "A reliable route that turns traffic into momentum.",
    flavor: "Cargo does not care about rush hour.",
  },
  {
    id: "night-bus",
    code: "MOV-07",
    name: "Night Bus",
    sector: "MOVE",
    rarity: "COMMON",
    cost: 1,
    work: 2,
    guard: 3,
    description: "Protect the shift and keep one energy for the next round.",
    flavor: "Last service, 23:48. Do not miss it.",
  },
  {
    id: "machine-focus",
    code: "IND-02",
    name: "Machine Focus",
    sector: "INDUSTRY",
    rarity: "COMMON",
    cost: 1,
    work: 3,
    guard: 2,
    description: "Steady production with no wasted motion.",
    flavor: "Hands, gauges, rhythm.",
  },
  {
    id: "steel-shift",
    code: "IND-06",
    name: "Steel Shift",
    sector: "INDUSTRY",
    rarity: "RARE",
    cost: 2,
    work: 6,
    guard: 0,
    description: "Heavy output. Lose one guard if the grid is overloaded.",
    flavor: "The furnace makes its own sunrise.",
  },
  {
    id: "grid-reserve",
    code: "IND-09",
    name: "Grid Reserve",
    sector: "INDUSTRY",
    rarity: "EPIC",
    cost: 3,
    work: 5,
    guard: 5,
    description: "Release emergency power and stabilize the entire play.",
    flavor: "A city is only alive while the lights stay on.",
  },
  {
    id: "counter-service",
    code: "MKT-01",
    name: "Counter Service",
    sector: "MARKET",
    rarity: "COMMON",
    cost: 1,
    work: 3,
    guard: 2,
    description: "Read the customer and close the sale.",
    flavor: "Good morning. You are exactly on time.",
  },
  {
    id: "market-signal",
    code: "MKT-05",
    name: "Market Signal",
    sector: "MARKET",
    rarity: "RARE",
    cost: 2,
    work: 4,
    guard: 4,
    description: "Adapt the price before the opponent resolves demand.",
    flavor: "The price changed before the sign did.",
  },
  {
    id: "sakura-rush",
    code: "MKT-08",
    name: "Sakura Rush",
    sector: "MARKET",
    rarity: "EPIC",
    cost: 3,
    work: 8,
    guard: 1,
    description: "A perfect service chain creates exceptional output.",
    flavor: "Six tables. Four minutes. One calm breath.",
  },
  {
    id: "ledger-check",
    code: "FIN-02",
    name: "Ledger Check",
    sector: "FINANCE",
    rarity: "COMMON",
    cost: 1,
    work: 2,
    guard: 4,
    description: "Prevent a risk penalty and verify the books.",
    flavor: "Every number should know where it came from.",
  },
  {
    id: "capital-route",
    code: "FIN-05",
    name: "Capital Route",
    sector: "FINANCE",
    rarity: "RARE",
    cost: 2,
    work: 5,
    guard: 3,
    description: "Move funds where the city creates the most value.",
    flavor: "Money is another kind of traffic.",
  },
  {
    id: "civic-bond",
    code: "FIN-10",
    name: "Civic Bond",
    sector: "FINANCE",
    rarity: "EPIC",
    cost: 3,
    work: 6,
    guard: 5,
    description: "A long-term promise backed by district reputation.",
    flavor: "We build today. The city remembers tomorrow.",
  },
  {
    id: "supply-router",
    code: "HK-01",
    name: "Supply Router",
    sector: "HOOK",
    rarity: "RARE",
    cost: 2,
    work: 5,
    guard: 2,
    description: "Route low inventory to the next production card.",
    flavor: "IF stock is low, THEN the city moves.",
  },
  {
    id: "traffic-oracle",
    code: "HK-03",
    name: "Traffic Oracle",
    sector: "HOOK",
    rarity: "RARE",
    cost: 2,
    work: 4,
    guard: 4,
    description: "Forecast the rival play and add defensive control.",
    flavor: "A red light is information.",
  },
  {
    id: "shift-rewards",
    code: "HK-05",
    name: "Shift Rewards",
    sector: "HOOK",
    rarity: "EPIC",
    cost: 3,
    work: 7,
    guard: 3,
    description: "Convert a verified action into bonus progression.",
    flavor: "The work happened. The record proves it.",
  },
  {
    id: "treasury-split",
    code: "HK-06",
    name: "Treasury Split",
    sector: "HOOK",
    rarity: "EPIC",
    cost: 3,
    work: 5,
    guard: 6,
    description: "Split value between the worker and the business.",
    flavor: "One transaction. Two futures.",
  },
];

export const STARTER_COLLECTION = CITY_CARDS.slice(0, 12).map((card) => card.id);
export const STARTER_DECK = [
  "district-runner",
  "night-bus",
  "machine-focus",
  "steel-shift",
  "counter-service",
  "market-signal",
  "ledger-check",
  "capital-route",
];

export const SECTOR_COLORS: Record<CardSector, string> = {
  MOVE: "#67d7e5",
  INDUSTRY: "#f4d35e",
  MARKET: "#65d6a6",
  FINANCE: "#82c0ff",
  HOOK: "#ff5d9e",
};

export function getCard(id: string) {
  return CITY_CARDS.find((card) => card.id === id);
}

