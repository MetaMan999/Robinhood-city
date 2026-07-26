export type BuildingKind =
  | "utility"
  | "industry"
  | "commerce"
  | "finance"
  | "civic"
  | "residential"
  | "transport"
  | "entertainment";

export type Building = {
  id: string;
  name: string;
  shortName: string;
  kind: BuildingKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  accent: string;
  price: number;
  description: string;
  open: [number, number];
  jobs: string[];
};

export type Job = {
  id: string;
  buildingId: string;
  title: string;
  pay: number;
  duration: number;
  reputation: number;
  requiredReputation: number;
  description: string;
};

export type BusinessState = {
  inventory: number;
  cash: number;
  workers: number;
  demand: number;
  output: number;
  level: number;
};

export type RuleDefinition = {
  id: string;
  buildingId: string;
  title: string;
  condition: string;
  action: string;
  description: string;
  enabled: boolean;
};

export type HookModule = {
  id: string;
  name: string;
  code: string;
  trigger: string;
  action: string;
  description: string;
  color: string;
  cost: number;
  buildingId: string;
  installedByDefault: boolean;
};

export const MAP_WIDTH = 1920;
export const MAP_HEIGHT = 1240;
export const ROAD_WIDTH = 96;
export const ROAD_X = [300, 730, 1160, 1600];
export const ROAD_Y = [270, 610, 950];

export const BUILDINGS: Building[] = [
  {
    id: "hikari-power",
    name: "Hikari Power",
    shortName: "POWER",
    kind: "utility",
    x: 34,
    y: 40,
    w: 220,
    h: 174,
    color: "#283d50",
    accent: "#f4d35e",
    price: 7200,
    description: "The city grid. Turbines convert imported fuel into reliable power.",
    open: [0, 24],
    jobs: ["Grid Technician", "Night Controller"],
  },
  {
    id: "mizuno-water",
    name: "Mizuno Waterworks",
    shortName: "WATER",
    kind: "utility",
    x: 374,
    y: 52,
    w: 302,
    h: 152,
    color: "#21475b",
    accent: "#67d7e5",
    price: 6500,
    description: "Pumps clean water to every district and charges commercial users.",
    open: [0, 24],
    jobs: ["Pump Operator", "Pipe Inspector"],
  },
  {
    id: "north-mine",
    name: "North Hills Mine",
    shortName: "MINE 07",
    kind: "industry",
    x: 804,
    y: 34,
    w: 306,
    h: 184,
    color: "#493b45",
    accent: "#e18f5b",
    price: 8900,
    description: "Copper and iron ore descend from the north hills by conveyor.",
    open: [5, 22],
    jobs: ["Ore Sorter", "Drill Operator"],
  },
  {
    id: "shinjo-rail",
    name: "Shinjo Rail Yard",
    shortName: "RAIL",
    kind: "transport",
    x: 1234,
    y: 44,
    w: 314,
    h: 164,
    color: "#34404a",
    accent: "#ffb866",
    price: 9800,
    description: "Freight enters the city here. Delays ripple through every factory.",
    open: [0, 24],
    jobs: ["Yard Switcher", "Cargo Clerk"],
  },
  {
    id: "sora-radio",
    name: "Sora Broadcast",
    shortName: "SORA FM",
    kind: "commerce",
    x: 1660,
    y: 44,
    w: 224,
    h: 168,
    color: "#3a3153",
    accent: "#ff65c3",
    price: 4800,
    description: "News, job listings, and market reports for a city that never stops.",
    open: [6, 23],
    jobs: ["Radio Producer", "Ad Sales"],
  },
  {
    id: "yamato-steel",
    name: "Yamato Steel",
    shortName: "STEEL",
    kind: "industry",
    x: 34,
    y: 356,
    w: 222,
    h: 198,
    color: "#473c43",
    accent: "#ff765e",
    price: 12500,
    description: "Ore and power become machine steel. The district's largest employer.",
    open: [5, 23],
    jobs: ["Furnace Helper", "Line Supervisor"],
  },
  {
    id: "kiso-warehouse",
    name: "Kiso Warehouse",
    shortName: "KISO",
    kind: "industry",
    x: 370,
    y: 374,
    w: 308,
    h: 166,
    color: "#3c4650",
    accent: "#70c1b3",
    price: 6200,
    description: "Raw materials, spare parts, and finished goods wait behind steel shutters.",
    open: [4, 24],
    jobs: ["Forklift Driver", "Inventory Clerk"],
  },
  {
    id: "nami-electronics",
    name: "Nami Electronics",
    shortName: "NAMI",
    kind: "industry",
    x: 804,
    y: 356,
    w: 306,
    h: 198,
    color: "#2f4351",
    accent: "#68e1fd",
    price: 13200,
    description: "A high-output assembly floor producing radios and home computers.",
    open: [6, 22],
    jobs: ["Assembly Tech", "Quality Inspector"],
  },
  {
    id: "freight-depot",
    name: "Kurogane Freight",
    shortName: "FREIGHT",
    kind: "transport",
    x: 1234,
    y: 374,
    w: 314,
    h: 168,
    color: "#37454b",
    accent: "#ffcc66",
    price: 7600,
    description: "Trucks move resources between industry, warehouses, and downtown shops.",
    open: [0, 24],
    jobs: ["Delivery Runner", "Dispatcher"],
  },
  {
    id: "sun-auto",
    name: "Sunrise Auto Works",
    shortName: "AUTO",
    kind: "industry",
    x: 1660,
    y: 366,
    w: 224,
    h: 180,
    color: "#41384c",
    accent: "#ef7ed0",
    price: 8400,
    description: "Repairs taxis, freight vans, and the compact cars crowding the ring road.",
    open: [7, 20],
    jobs: ["Garage Assistant", "Mechanic"],
  },
  {
    id: "central-station",
    name: "Rhoos Central Station",
    shortName: "中央駅",
    kind: "transport",
    x: 34,
    y: 694,
    w: 222,
    h: 204,
    color: "#35434a",
    accent: "#ffca58",
    price: 11500,
    description: "Passengers and commuters pour into the center every morning.",
    open: [4, 24],
    jobs: ["Platform Attendant", "Ticket Clerk"],
  },
  {
    id: "kogane-bank",
    name: "Kogane Bank",
    shortName: "KOGANE",
    kind: "finance",
    x: 370,
    y: 704,
    w: 308,
    h: 184,
    color: "#2f4054",
    accent: "#7bdff2",
    price: 16000,
    description: "Deposits, business loans, and the financial pulse of District One.",
    open: [8, 18],
    jobs: ["Bank Courier", "Junior Teller"],
  },
  {
    id: "city-hall",
    name: "Rhoos City Hall",
    shortName: "CITY HALL",
    kind: "civic",
    x: 804,
    y: 690,
    w: 306,
    h: 204,
    color: "#3d3a55",
    accent: "#f3a6e8",
    price: 0,
    description: "Licenses, property records, taxes, and the city's programmable civic rules.",
    open: [8, 19],
    jobs: ["Records Runner", "Planning Clerk"],
  },
  {
    id: "harbor-market",
    name: "Harbor Market",
    shortName: "MARKET",
    kind: "commerce",
    x: 1234,
    y: 706,
    w: 314,
    h: 180,
    color: "#344a49",
    accent: "#65d6a6",
    price: 5800,
    description: "Food, household goods, and electronics trade hands all day.",
    open: [6, 22],
    jobs: ["Shelf Stocker", "Market Cashier"],
  },
  {
    id: "sakura-cafe",
    name: "Sakura Café",
    shortName: "喫茶 SAKURA",
    kind: "commerce",
    x: 1660,
    y: 710,
    w: 224,
    h: 174,
    color: "#493948",
    accent: "#ff8fab",
    price: 2400,
    description: "Coffee, curry, and late-night rumors. A realistic first property.",
    open: [6, 24],
    jobs: ["Dish Runner", "Counter Server"],
  },
  {
    id: "shiba-apartments",
    name: "Shiba Apartments",
    shortName: "SHIBA",
    kind: "residential",
    x: 34,
    y: 1034,
    w: 222,
    h: 164,
    color: "#3f4053",
    accent: "#c9a7eb",
    price: 4300,
    description: "Affordable units for industrial workers and new arrivals.",
    open: [0, 24],
    jobs: ["Caretaker", "Maintenance Helper"],
  },
  {
    id: "aoi-towers",
    name: "Aoi Towers",
    shortName: "AOI",
    kind: "residential",
    x: 370,
    y: 1020,
    w: 308,
    h: 180,
    color: "#354456",
    accent: "#82c0ff",
    price: 7500,
    description: "Mid-rise apartments overlooking the central traffic loop.",
    open: [0, 24],
    jobs: ["Doorman", "Building Manager"],
  },
  {
    id: "kanda-clinic",
    name: "Kanda Clinic",
    shortName: "CLINIC",
    kind: "civic",
    x: 804,
    y: 1026,
    w: 306,
    h: 170,
    color: "#354b50",
    accent: "#73e2a7",
    price: 0,
    description: "Emergency care and worker health services for the south district.",
    open: [0, 24],
    jobs: ["Medical Courier", "Reception Clerk"],
  },
  {
    id: "moon-arcade",
    name: "Moonlight Arcade",
    shortName: "MOON 8",
    kind: "entertainment",
    x: 1234,
    y: 1026,
    w: 314,
    h: 170,
    color: "#433453",
    accent: "#e85dff",
    price: 3200,
    description: "Cabinets, music, and a glowing refuge after the factories close.",
    open: [11, 2],
    jobs: ["Token Clerk", "Machine Repair"],
  },
  {
    id: "pocket-motors",
    name: "Pocket Motors",
    shortName: "MOTORS",
    kind: "commerce",
    x: 1660,
    y: 1026,
    w: 224,
    h: 170,
    color: "#3f3b4b",
    accent: "#ff9966",
    price: 3900,
    description: "Compact cars, bicycles, and used delivery vans for ambitious operators.",
    open: [8, 20],
    jobs: ["Lot Assistant", "Sales Trainee"],
  },
];

const jobBlueprints = [
  ["hikari-power", "Grid Technician", 440, 10, 3, 4, "Balance turbine output during a demand surge."],
  ["mizuno-water", "Pump Operator", 360, 8, 2, 2, "Inspect two pumps and restore stable flow."],
  ["north-mine", "Ore Sorter", 300, 7, 2, 0, "Separate copper ore from low-grade rock."],
  ["yamato-steel", "Furnace Helper", 380, 9, 3, 2, "Run a hot production shift on the steel floor."],
  ["kiso-warehouse", "Forklift Driver", 340, 8, 2, 0, "Move incoming pallets into marked bays."],
  ["nami-electronics", "Assembly Tech", 420, 10, 3, 4, "Complete a precision radio assembly batch."],
  ["freight-depot", "Delivery Runner", 280, 6, 2, 0, "Carry a priority shipment across the depot."],
  ["sun-auto", "Garage Assistant", 300, 7, 2, 1, "Service a taxi before the evening rush."],
  ["central-station", "Platform Attendant", 270, 6, 2, 0, "Guide the commuter rush to the correct platforms."],
  ["kogane-bank", "Bank Courier", 360, 8, 3, 5, "Deliver secured documents before closing."],
  ["city-hall", "Records Runner", 310, 7, 2, 3, "File new business licenses in the civic archive."],
  ["harbor-market", "Shelf Stocker", 240, 5, 1, 0, "Restock fresh goods before the dinner crowd."],
  ["sakura-cafe", "Dish Runner", 220, 5, 1, 0, "Help Sakura Café survive the lunch rush."],
  ["shiba-apartments", "Caretaker", 260, 6, 2, 1, "Repair hallway lights and collect maintenance notes."],
  ["aoi-towers", "Doorman", 300, 7, 2, 2, "Manage deliveries during the residential rush."],
  ["kanda-clinic", "Medical Courier", 390, 8, 3, 5, "Move urgent supplies from storage to the clinic."],
  ["moon-arcade", "Token Clerk", 240, 5, 1, 0, "Refill token machines and assist evening players."],
  ["pocket-motors", "Lot Assistant", 290, 6, 2, 1, "Prepare compact cars for the showroom."],
] as const;

export const JOBS: Job[] = jobBlueprints.map(
  ([buildingId, title, pay, duration, reputation, requiredReputation, description], index) => ({
    id: `job-${index + 1}`,
    buildingId,
    title,
    pay,
    duration,
    reputation,
    requiredReputation,
    description,
  }),
);

export const INITIAL_RULES: RuleDefinition[] = [
  {
    id: "rule-steel-order",
    buildingId: "yamato-steel",
    title: "Automatic ore order",
    condition: "ORE STOCK < 18",
    action: "BUY 24 ORE FROM KISO",
    description: "Keeps steel production alive but spends factory cash.",
    enabled: true,
  },
  {
    id: "rule-market-price",
    buildingId: "harbor-market",
    title: "Evening markdown",
    condition: "TIME > 19:00 & STOCK > 45",
    action: "DEMAND +15%",
    description: "Clears excess inventory before closing.",
    enabled: true,
  },
  {
    id: "rule-grid-reserve",
    buildingId: "hikari-power",
    title: "Grid reserve",
    condition: "CITY LOAD > 82%",
    action: "OUTPUT +18 / COST ¥90",
    description: "Protects the industrial district from brownouts.",
    enabled: true,
  },
  {
    id: "rule-cafe-hire",
    buildingId: "sakura-cafe",
    title: "Lunch temp worker",
    condition: "DEMAND > 64 & WORKERS < 5",
    action: "HIRE 1 TEMP WORKER",
    description: "Adds capacity when the café gets crowded.",
    enabled: false,
  },
  {
    id: "rule-freight-priority",
    buildingId: "freight-depot",
    title: "Priority electronics lane",
    condition: "NAMI STOCK < 20",
    action: "MOVE 12 GOODS TO NAMI",
    description: "Routes scarce components to the electronics line.",
    enabled: true,
  },
  {
    id: "rule-bank-credit",
    buildingId: "kogane-bank",
    title: "Small business credit",
    condition: "CITY EMPLOYMENT > 70%",
    action: "BUSINESS DEMAND +5%",
    description: "Loosens working-capital loans when employment is healthy.",
    enabled: false,
  },
];

export const HOOK_MODULES: HookModule[] = [
  {
    id: "supply-router",
    name: "Supply Router",
    code: "HK-01",
    trigger: "BEFORE_STOCKOUT",
    action: "ROUTE INVENTORY",
    description:
      "Moves available material between city businesses before a production line stalls.",
    color: "#67d7e5",
    cost: 0,
    buildingId: "yamato-steel",
    installedByDefault: true,
  },
  {
    id: "dynamic-market",
    name: "Dynamic Market",
    code: "HK-02",
    trigger: "AFTER_SALE",
    action: "ADJUST DEMAND",
    description:
      "Reads time, inventory, and foot traffic to tune market demand after every sale.",
    color: "#ff5d9e",
    cost: 0,
    buildingId: "harbor-market",
    installedByDefault: true,
  },
  {
    id: "shift-rewards",
    name: "Shift-to-Earn",
    code: "HK-03",
    trigger: "AFTER_SHIFT",
    action: "BONUS +15%",
    description:
      "Adds a protocol-funded performance bonus when a verified city shift completes.",
    color: "#f4d35e",
    cost: 420,
    buildingId: "city-hall",
    installedByDefault: false,
  },
  {
    id: "traffic-oracle",
    name: "Traffic Oracle",
    code: "HK-04",
    trigger: "BEFORE_DISPATCH",
    action: "OPTIMIZE ROUTE",
    description:
      "Uses live road congestion to increase successful freight deliveries.",
    color: "#65d6a6",
    cost: 520,
    buildingId: "freight-depot",
    installedByDefault: false,
  },
  {
    id: "treasury-split",
    name: "Treasury Split",
    code: "HK-05",
    trigger: "AFTER_REVENUE",
    action: "60% PAY / 40% REINVEST",
    description:
      "Splits property income between the player wallet and automatic business growth.",
    color: "#c9a7eb",
    cost: 680,
    buildingId: "kogane-bank",
    installedByDefault: false,
  },
  {
    id: "grid-guard",
    name: "Grid Guard",
    code: "HK-06",
    trigger: "ON_LOAD_SPIKE",
    action: "RELEASE RESERVE",
    description:
      "Releases emergency grid capacity when industrial load crosses its safe threshold.",
    color: "#ff9966",
    cost: 560,
    buildingId: "hikari-power",
    installedByDefault: false,
  },
];

export function makeInitialBusinesses(): Record<string, BusinessState> {
  return Object.fromEntries(
    BUILDINGS.map((building, index) => [
      building.id,
      {
        inventory: 24 + ((index * 13) % 55),
        cash: 1800 + ((index * 743) % 5200),
        workers: 3 + (index % 8),
        demand: 38 + ((index * 11) % 50),
        output: 22 + ((index * 9) % 60),
        level: 1,
      },
    ]),
  );
}

export const NPC_NAMES = [
  "Aki Tanaka",
  "Mika Sato",
  "Jun Ito",
  "Emi Kuroda",
  "Ren Mori",
  "Yui Shimizu",
  "Haru Nakai",
  "Nori Abe",
  "Kei Fujita",
  "Mai Watanabe",
  "Toru Ishii",
  "Aya Kondo",
  "Riku Endo",
  "Sora Hayashi",
  "Nao Kimura",
  "Ken Ozawa",
  "Fumi Arai",
  "Rei Matsuda",
  "Momo Kato",
  "Shin Okada",
];

export const CAR_COLORS = [
  "#f45b69",
  "#67d7e5",
  "#f4d35e",
  "#e7e7e7",
  "#8d72e1",
  "#70c1b3",
  "#ff9f68",
  "#ef7ed0",
];
