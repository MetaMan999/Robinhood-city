export type AssetCategory =
  | "VEHICLE"
  | "BUSINESS"
  | "PROPERTY"
  | "CONTRACT"
  | "HOOK";

export type EconomyAsset = {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  rarity: "COMMON" | "RARE" | "EPIC";
  baseValue: number;
  yieldPerCycle: number;
  supply: number;
  color: string;
  function: string;
  description: string;
};

export type Cooperative = {
  id: string;
  code: string;
  name: string;
  district: string;
  focus: string;
  members: number;
  treasury: number;
  color: string;
  revenueShare: number;
  description: string;
};

export const ECONOMY_ASSETS: EconomyAsset[] = [
  {
    id: "asset-courier-bike",
    code: "MOV-101",
    name: "Courier Bike",
    category: "VEHICLE",
    rarity: "COMMON",
    baseValue: 420,
    yieldPerCycle: 9,
    supply: 400,
    color: "#67d7e5",
    function: "Adds city value to movement and courier work.",
    description: "A nimble street vehicle codified for neighborhood delivery work.",
  },
  {
    id: "asset-rho86-deed",
    code: "CAR-086",
    name: "RHO-86 Vehicle Deed",
    category: "VEHICLE",
    rarity: "RARE",
    baseValue: 1850,
    yieldPerCycle: 22,
    supply: 86,
    color: "#f4d35e",
    function: "Represents a transferable city coupe ownership record.",
    description: "A serialized deed for District One's iconic street coupe.",
  },
  {
    id: "asset-garage-tools",
    code: "IND-214",
    name: "Mechanic Tool Set",
    category: "CONTRACT",
    rarity: "COMMON",
    baseValue: 680,
    yieldPerCycle: 15,
    supply: 240,
    color: "#ff9966",
    function: "Increases the functional value of completed mechanic work.",
    description: "Portable diagnostics and repair tools registered to one operator.",
  },
  {
    id: "asset-sakura-share",
    code: "BIZ-022",
    name: "Sakura Café Share",
    category: "BUSINESS",
    rarity: "RARE",
    baseValue: 1320,
    yieldPerCycle: 28,
    supply: 100,
    color: "#ff8fab",
    function: "Receives simulated revenue when commercial demand is strong.",
    description: "A limited city share representing participation in café output.",
  },
  {
    id: "asset-harbor-stall",
    code: "PRP-144",
    name: "Harbor Stall License",
    category: "PROPERTY",
    rarity: "RARE",
    baseValue: 1540,
    yieldPerCycle: 31,
    supply: 64,
    color: "#65d6a6",
    function: "Produces marketplace income from local demand.",
    description: "A transferable operating license for one Harbor Market stall.",
  },
  {
    id: "asset-auto-share",
    code: "BIZ-310",
    name: "Sunrise Auto Share",
    category: "BUSINESS",
    rarity: "EPIC",
    baseValue: 2800,
    yieldPerCycle: 52,
    supply: 40,
    color: "#ef7ed0",
    function: "Participates in repair revenue and the vehicle economy.",
    description: "A scarce ownership unit in the district's primary repair business.",
  },
  {
    id: "asset-freight-route",
    code: "CTR-404",
    name: "Freight Route Permit",
    category: "CONTRACT",
    rarity: "RARE",
    baseValue: 1180,
    yieldPerCycle: 26,
    supply: 120,
    color: "#ffcc66",
    function: "Earns simulated route fees when traffic is flowing.",
    description: "A codified right to service one recurring industrial delivery route.",
  },
  {
    id: "asset-grid-certificate",
    code: "UTL-018",
    name: "Grid Capacity Certificate",
    category: "CONTRACT",
    rarity: "EPIC",
    baseValue: 3200,
    yieldPerCycle: 58,
    supply: 32,
    color: "#f4d35e",
    function: "Participates in utility output when the city grid is active.",
    description: "A limited certificate tied to functional power capacity.",
  },
  {
    id: "asset-runner-hook",
    code: "V4H-301",
    name: "Runner Hook Module",
    category: "HOOK",
    rarity: "RARE",
    baseValue: 980,
    yieldPerCycle: 18,
    supply: 300,
    color: "#67d7e5",
    function: "Routes traffic intelligence into courier and vehicle activity.",
    description: "A codified v4 Hook function for player-controlled movement systems.",
  },
  {
    id: "asset-worker-hook",
    code: "V4H-302",
    name: "Worker Hook Module",
    category: "HOOK",
    rarity: "EPIC",
    baseValue: 1750,
    yieldPerCycle: 36,
    supply: 180,
    color: "#65d6a6",
    function: "Routes verified work into progression and cooperative rewards.",
    description: "A transferable work-rule module for jobs and shared revenue.",
  },
  {
    id: "asset-founder-hook",
    code: "V4H-303",
    name: "Founder Hook Module",
    category: "HOOK",
    rarity: "EPIC",
    baseValue: 2600,
    yieldPerCycle: 48,
    supply: 90,
    color: "#ff5d9e",
    function: "Automates treasury splits for businesses and cooperatives.",
    description: "A scarce governance rule for player-owned economic systems.",
  },
  {
    id: "asset-aoi-unit",
    code: "PRP-508",
    name: "Aoi Residential Unit",
    category: "PROPERTY",
    rarity: "EPIC",
    baseValue: 3600,
    yieldPerCycle: 63,
    supply: 48,
    color: "#82c0ff",
    function: "Produces simulated rent and provides a persistent city home.",
    description: "A codified residential unit overlooking the central traffic loop.",
  },
];

export const COOPERATIVES: Cooperative[] = [
  {
    id: "coop-harbor-hands",
    code: "COOP-18",
    name: "Harbor Hands",
    district: "HARBOR DISTRICT",
    focus: "Commerce + delivery",
    members: 18,
    treasury: 18400,
    color: "#65d6a6",
    revenueShare: 0.08,
    description: "Merchants and couriers pool vehicles, market access, and local contracts.",
  },
  {
    id: "coop-east-works",
    code: "COOP-07",
    name: "East Works Union",
    district: "EAST WORKS",
    focus: "Mechanics + industry",
    members: 27,
    treasury: 32600,
    color: "#f4d35e",
    revenueShare: 0.1,
    description: "Mechanics and factory operators coordinate repair and production capacity.",
  },
  {
    id: "coop-central-loop",
    code: "COOP-31",
    name: "Central Loop Collective",
    district: "FINANCIAL CORE",
    focus: "Finance + property",
    members: 31,
    treasury: 51200,
    color: "#ff5d9e",
    revenueShare: 0.12,
    description: "Founders combine property shares, capital routes, and treasury rules.",
  },
];
