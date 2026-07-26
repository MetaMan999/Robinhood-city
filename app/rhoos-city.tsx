"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BUILDINGS,
  CAR_COLORS,
  INITIAL_RULES,
  JOBS,
  MAP_HEIGHT,
  MAP_WIDTH,
  NPC_NAMES,
  ROAD_WIDTH,
  ROAD_X,
  ROAD_Y,
  makeInitialBusinesses,
  type Building,
  type BusinessState,
  type Job,
  type RuleDefinition,
} from "./game-data";

type ActiveJob = {
  jobId: string;
  progress: number;
  working: boolean;
};

type Engine = {
  player: { x: number; y: number; facing: "up" | "down" | "left" | "right" };
  camera: { x: number; y: number };
  simMinutes: number;
  day: number;
  speed: 1 | 3 | 8;
  paused: boolean;
  cash: number;
  energy: number;
  reputation: number;
  selectedId: string;
  businesses: Record<string, BusinessState>;
  rules: RuleDefinition[];
  properties: string[];
  activeJob: ActiveJob | null;
  jobsCompleted: number;
  shiftStarted: boolean;
  events: string[];
  cityGDP: number;
  employment: number;
  powerLoad: number;
  economyAccumulator: number;
  uiAccumulator: number;
  elapsed: number;
};

type PanelTab = "overview" | "jobs" | "rules";

const VIEW_W = 1000;
const VIEW_H = 620;
const SAVE_KEY = "rhoos-city-save-v1";

const KIND_LABEL: Record<Building["kind"], string> = {
  utility: "UTILITY",
  industry: "INDUSTRY",
  commerce: "COMMERCE",
  finance: "FINANCE",
  civic: "CIVIC",
  residential: "RESIDENTIAL",
  transport: "TRANSPORT",
  entertainment: "LEISURE",
};

function initialEngine(): Engine {
  return {
    player: { x: 990, y: 955, facing: "up" },
    camera: { x: 490, y: 645 },
    simMinutes: 6 * 60 + 40,
    day: 1,
    speed: 1,
    paused: false,
    cash: 3200,
    energy: 86,
    reputation: 0,
    selectedId: "city-hall",
    businesses: makeInitialBusinesses(),
    rules: INITIAL_RULES.map((rule) => ({ ...rule })),
    properties: [],
    activeJob: null,
    jobsCompleted: 0,
    shiftStarted: false,
    events: [
      "06:40  District One simulation online.",
      "06:42  Morning freight has entered Shinjo Yard.",
      "06:45  City Hall posted new starter jobs.",
    ],
    cityGDP: 42800,
    employment: 76,
    powerLoad: 61,
    economyAccumulator: 0,
    uiAccumulator: 0,
    elapsed: 0,
  };
}

function formatMoney(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("en-US")}`;
}

function clockParts(engine: Engine) {
  const minutes = Math.floor(engine.simMinutes % 1440);
  const hour = Math.floor(minutes / 60);
  return {
    hour,
    minute: minutes % 60,
    text: `${String(hour).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
  };
}

function buildingCenter(building: Building) {
  return { x: building.x + building.w / 2, y: building.y + building.h / 2 };
}

function distanceToRect(x: number, y: number, building: Building) {
  const dx = Math.max(building.x - x, 0, x - (building.x + building.w));
  const dy = Math.max(building.y - y, 0, y - (building.y + building.h));
  return Math.hypot(dx, dy);
}

function isOpen(building: Building, hour: number) {
  const [start, end] = building.open;
  if (start === 0 && end === 24) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function addEvent(engine: Engine, message: string) {
  const time = clockParts(engine).text;
  engine.events = [`${time}  ${message}`, ...engine.events].slice(0, 7);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rectCollidesBuilding(x: number, y: number) {
  return BUILDINGS.some(
    (building) =>
      x > building.x - 10 &&
      x < building.x + building.w + 10 &&
      y > building.y - 10 &&
      y < building.y + building.h + 10,
  );
}

function npcTarget(index: number, simMinutes: number) {
  const hour = (simMinutes % 1440) / 60;
  const homes = BUILDINGS.filter((building) => building.kind === "residential");
  const works = BUILDINGS.filter(
    (building) =>
      building.kind !== "residential" && building.kind !== "entertainment",
  );
  const home = buildingCenter(homes[index % homes.length]);
  const work = buildingCenter(works[(index * 3 + 2) % works.length]);
  const market = buildingCenter(
    BUILDINGS.find((building) =>
      index % 3 === 0
        ? building.id === "moon-arcade"
        : index % 2 === 0
          ? building.id === "harbor-market"
          : building.id === "sakura-cafe",
    )!,
  );

  let from = home;
  let to = home;
  let t = 0;
  let status = "AT HOME";
  if (hour >= 6.5 && hour < 8) {
    from = home;
    to = work;
    t = (hour - 6.5) / 1.5;
    status = "COMMUTING";
  } else if (hour >= 8 && hour < 17) {
    from = work;
    to = work;
    status = "WORKING";
  } else if (hour >= 17 && hour < 18.5) {
    from = work;
    to = market;
    t = (hour - 17) / 1.5;
    status = "OUT IN CITY";
  } else if (hour >= 18.5 && hour < 20.5) {
    from = market;
    to = market;
    status = "SHOPPING";
  } else if (hour >= 20.5 && hour < 22) {
    from = market;
    to = home;
    t = (hour - 20.5) / 1.5;
    status = "GOING HOME";
  }

  const bendFirst = index % 2 === 0;
  if (t <= 0) return { ...from, status };
  if (t >= 1) return { ...to, status };
  if (t < 0.5) {
    const p = t * 2;
    return bendFirst
      ? { x: from.x + (to.x - from.x) * p, y: from.y, status }
      : { x: from.x, y: from.y + (to.y - from.y) * p, status };
  }
  const p = (t - 0.5) * 2;
  return bendFirst
    ? { x: to.x, y: from.y + (to.y - from.y) * p, status }
    : { x: from.x + (to.x - from.x) * p, y: to.y, status };
}

function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#f6f2e8",
  size = 12,
  align: CanvasTextAlign = "left",
) {
  ctx.save();
  ctx.fillStyle = "#0a0c14";
  ctx.font = `700 ${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.fillText(text, Math.round(x + 2), Math.round(y + 2));
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x), Math.round(y));
  ctx.restore();
}

function runEconomy(engine: Engine) {
  const businesses = engine.businesses;
  const hour = clockParts(engine).hour;
  const power = businesses["hikari-power"];
  const mine = businesses["north-mine"];
  const warehouse = businesses["kiso-warehouse"];
  const steel = businesses["yamato-steel"];
  const electronics = businesses["nami-electronics"];
  const freight = businesses["freight-depot"];
  const market = businesses["harbor-market"];
  const cafe = businesses["sakura-cafe"];

  engine.powerLoad = clamp(
    56 +
      steel.output * 0.18 +
      electronics.output * 0.2 +
      Math.sin(engine.elapsed / 16) * 8,
    42,
    97,
  );
  power.output = Math.round(72 + Math.sin(engine.elapsed / 12) * 9);
  power.cash += Math.round(engine.powerLoad * 1.1);
  mine.inventory = clamp(mine.inventory + 5, 0, 120);
  mine.cash += 38;
  warehouse.inventory = clamp(warehouse.inventory + 3, 0, 140);

  if (mine.inventory >= 4 && power.output > 45) {
    mine.inventory -= 4;
    steel.inventory = clamp(steel.inventory + 7, 0, 130);
    steel.cash += 54;
  }
  if (steel.inventory >= 5 && electronics.inventory < 120) {
    steel.inventory -= 5;
    electronics.inventory += 8;
    electronics.cash += 72;
  }
  if (electronics.inventory >= 4 && market.inventory < 120) {
    electronics.inventory -= 4;
    market.inventory += 4;
    freight.cash += 26;
  }
  if (isOpen(BUILDINGS.find((item) => item.id === "harbor-market")!, hour)) {
    const sales = Math.min(market.inventory, Math.max(2, Math.round(market.demand / 15)));
    market.inventory -= sales;
    market.cash += sales * 38;
  }
  if (isOpen(BUILDINGS.find((item) => item.id === "sakura-cafe")!, hour)) {
    cafe.cash += Math.round(cafe.demand * 1.8);
    cafe.inventory = clamp(cafe.inventory - 2 + (cafe.inventory < 18 ? 5 : 0), 0, 100);
  }

  for (const rule of engine.rules) {
    if (!rule.enabled) continue;
    if (rule.id === "rule-steel-order" && steel.inventory < 18 && warehouse.inventory >= 10) {
      warehouse.inventory -= 10;
      steel.inventory += 10;
      steel.cash -= 120;
      warehouse.cash += 120;
    }
    if (rule.id === "rule-market-price" && hour >= 19 && market.inventory > 45) {
      market.demand = clamp(market.demand + 4, 0, 100);
    }
    if (rule.id === "rule-grid-reserve" && engine.powerLoad > 82) {
      power.output = clamp(power.output + 18, 0, 120);
      power.cash -= 90;
    }
    if (rule.id === "rule-cafe-hire" && cafe.demand > 64 && cafe.workers < 5) {
      cafe.workers += 1;
      cafe.cash -= 110;
    }
    if (
      rule.id === "rule-freight-priority" &&
      electronics.inventory < 20 &&
      freight.inventory >= 12
    ) {
      freight.inventory -= 12;
      electronics.inventory += 12;
    }
    if (rule.id === "rule-bank-credit" && engine.employment > 70) {
      market.demand = clamp(market.demand + 1, 0, 100);
      cafe.demand = clamp(cafe.demand + 1, 0, 100);
    }
  }

  engine.cityGDP = Math.round(
    Object.values(businesses).reduce(
      (sum, business) => sum + business.cash * 0.22 + business.output * 18,
      0,
    ),
  );
  engine.employment = clamp(
    Math.round(
      63 +
        Object.values(businesses).reduce((sum, business) => sum + business.workers, 0) /
          8,
    ),
    60,
    96,
  );

  for (const propertyId of engine.properties) {
    const business = businesses[propertyId];
    if (!business) continue;
    const dividend = Math.round(14 + business.level * 8 + business.demand / 8);
    engine.cash += dividend;
  }
}

function renderCity(ctx: CanvasRenderingContext2D, engine: Engine) {
  const camera = engine.camera;
  const { hour, minute } = clockParts(engine);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.translate(-Math.round(camera.x), -Math.round(camera.y));

  ctx.fillStyle = "#1d2e32";
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  for (let y = 0; y < MAP_HEIGHT; y += 32) {
    for (let x = 0; x < MAP_WIDTH; x += 32) {
      const odd = ((x / 32 + y / 32) | 0) % 2;
      ctx.fillStyle = odd ? "#21383a" : "#233c3d";
      ctx.fillRect(x, y, 31, 31);
    }
  }

  ctx.fillStyle = "#22313b";
  for (const x of ROAD_X) ctx.fillRect(x - ROAD_WIDTH / 2, 0, ROAD_WIDTH, MAP_HEIGHT);
  for (const y of ROAD_Y) ctx.fillRect(0, y - ROAD_WIDTH / 2, MAP_WIDTH, ROAD_WIDTH);

  ctx.strokeStyle = "#3c4b54";
  ctx.lineWidth = 2;
  for (const x of ROAD_X) {
    ctx.beginPath();
    ctx.moveTo(x - 26, 0);
    ctx.lineTo(x - 26, MAP_HEIGHT);
    ctx.moveTo(x + 26, 0);
    ctx.lineTo(x + 26, MAP_HEIGHT);
    ctx.stroke();
  }
  for (const y of ROAD_Y) {
    ctx.beginPath();
    ctx.moveTo(0, y - 26);
    ctx.lineTo(MAP_WIDTH, y - 26);
    ctx.moveTo(0, y + 26);
    ctx.lineTo(MAP_WIDTH, y + 26);
    ctx.stroke();
  }

  ctx.strokeStyle = "#a0a06f";
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 18]);
  for (const x of ROAD_X) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, MAP_HEIGHT);
    ctx.stroke();
  }
  for (const y of ROAD_Y) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(MAP_WIDTH, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const horizontalGreen = Math.floor(engine.simMinutes / 5) % 2 === 0;
  for (const x of ROAD_X) {
    for (const y of ROAD_Y) {
      ctx.fillStyle = "#161922";
      ctx.fillRect(x - 44, y - 44, 10, 18);
      ctx.fillRect(x + 34, y + 26, 10, 18);
      ctx.fillStyle = horizontalGreen ? "#65d6a6" : "#ff655c";
      ctx.fillRect(x - 42, y - 41, 6, 6);
      ctx.fillStyle = horizontalGreen ? "#ff655c" : "#65d6a6";
      ctx.fillRect(x + 36, y + 35, 6, 6);
    }
  }

  for (const building of BUILDINGS) {
    const selected = engine.selectedId === building.id;
    const owned = engine.properties.includes(building.id);
    const business = engine.businesses[building.id];

    ctx.fillStyle = "#10141c";
    ctx.fillRect(building.x + 8, building.y + 10, building.w, building.h);
    ctx.fillStyle = building.color;
    ctx.fillRect(building.x, building.y, building.w, building.h);
    ctx.fillStyle = "#19232d";
    ctx.fillRect(building.x + 8, building.y + 10, building.w - 16, 28);
    ctx.fillStyle = building.accent;
    ctx.fillRect(building.x + 8, building.y + 8, building.w - 16, 4);

    const floors = building.kind === "residential" ? 4 : 3;
    const columns = Math.max(3, Math.floor(building.w / 46));
    for (let row = 0; row < floors; row++) {
      for (let col = 0; col < columns; col++) {
        const wx = building.x + 18 + col * ((building.w - 36) / columns);
        const wy = building.y + 52 + row * 26;
        const lit =
          hour >= 18 || hour < 6
            ? (row + col + building.id.length) % 3 !== 0
            : (row + col) % 4 === 0;
        ctx.fillStyle = lit ? "#f5d97d" : "#273a47";
        ctx.fillRect(Math.round(wx), Math.round(wy), 16, 11);
      }
    }

    ctx.fillStyle = "#121821";
    ctx.fillRect(
      building.x + building.w / 2 - 17,
      building.y + building.h - 31,
      34,
      31,
    );
    ctx.fillStyle = building.accent;
    ctx.fillRect(
      building.x + building.w / 2 - 11,
      building.y + building.h - 23,
      7,
      16,
    );
    ctx.fillRect(
      building.x + building.w / 2 + 4,
      building.y + building.h - 23,
      7,
      16,
    );

    drawPixelText(
      ctx,
      building.shortName,
      building.x + building.w / 2,
      building.y + 29,
      building.accent,
      building.shortName.length > 10 ? 10 : 12,
      "center",
    );

    if (business.inventory < 15 && building.kind !== "civic") {
      ctx.fillStyle = "#ff655c";
      ctx.fillRect(building.x + building.w - 20, building.y + 17, 8, 8);
    }
    if (owned) {
      ctx.fillStyle = "#65d6a6";
      ctx.fillRect(building.x + 4, building.y + building.h - 9, building.w - 8, 5);
    }
    if (selected) {
      ctx.strokeStyle = "#fff4b8";
      ctx.lineWidth = 3;
      ctx.strokeRect(building.x - 4, building.y - 4, building.w + 8, building.h + 8);
      ctx.fillStyle = "#fff4b8";
      ctx.fillRect(building.x - 4, building.y - 4, 18, 4);
      ctx.fillRect(building.x + building.w - 10, building.y - 4, 18, 4);
    }
  }

  const carCount = 22;
  for (let index = 0; index < carCount; index++) {
    const horizontal = index < 14;
    const direction = index % 2 === 0 ? 1 : -1;
    let x: number;
    let y: number;
    let rotation = 0;
    if (horizontal) {
      y = ROAD_Y[index % ROAD_Y.length] + (direction > 0 ? -13 : 13);
      const base = (engine.elapsed * (42 + (index % 4) * 9) + index * 137) % MAP_WIDTH;
      x = direction > 0 ? base : MAP_WIDTH - base;
      rotation = direction > 0 ? 0 : Math.PI;
      if (!horizontalGreen) {
        for (const signalX of ROAD_X) {
          const delta = direction > 0 ? signalX - x : x - signalX;
          if (delta > 0 && delta < 32) x = signalX - direction * 32;
        }
      }
    } else {
      x = ROAD_X[index % ROAD_X.length] + (direction > 0 ? 13 : -13);
      const base = (engine.elapsed * (36 + (index % 3) * 8) + index * 181) % MAP_HEIGHT;
      y = direction > 0 ? base : MAP_HEIGHT - base;
      rotation = direction > 0 ? Math.PI / 2 : -Math.PI / 2;
      if (horizontalGreen) {
        for (const signalY of ROAD_Y) {
          const delta = direction > 0 ? signalY - y : y - signalY;
          if (delta > 0 && delta < 32) y = signalY - direction * 32;
        }
      }
    }
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rotation);
    ctx.fillStyle = "#0d1017";
    ctx.fillRect(-11, -6, 25, 14);
    ctx.fillStyle = CAR_COLORS[index % CAR_COLORS.length];
    ctx.fillRect(-12, -7, 24, 12);
    ctx.fillStyle = "#bde7f0";
    ctx.fillRect(-3, -5, 8, 8);
    ctx.fillStyle = "#fff4b8";
    ctx.fillRect(9, -5, 3, 3);
    ctx.fillRect(9, 2, 3, 3);
    ctx.restore();
  }

  for (let index = 0; index < NPC_NAMES.length; index++) {
    const npc = npcTarget(index, engine.simMinutes);
    const bob = Math.sin(engine.elapsed * 5 + index) > 0 ? 0 : 1;
    ctx.fillStyle = "#0b0d13";
    ctx.fillRect(Math.round(npc.x - 4), Math.round(npc.y - 8 + bob), 10, 15);
    ctx.fillStyle = index % 3 === 0 ? "#ff8fab" : index % 3 === 1 ? "#67d7e5" : "#f4d35e";
    ctx.fillRect(Math.round(npc.x - 3), Math.round(npc.y - 7 + bob), 7, 8);
    ctx.fillStyle = "#edc9a5";
    ctx.fillRect(Math.round(npc.x - 2), Math.round(npc.y - 12 + bob), 5, 5);
  }

  const player = engine.player;
  ctx.fillStyle = "#0b0d13";
  ctx.fillRect(Math.round(player.x - 7), Math.round(player.y - 12), 15, 23);
  ctx.fillStyle = "#f6f2e8";
  ctx.fillRect(Math.round(player.x - 5), Math.round(player.y - 10), 11, 10);
  ctx.fillStyle = "#ff5d9e";
  ctx.fillRect(Math.round(player.x - 5), Math.round(player.y), 11, 9);
  ctx.fillStyle = "#67d7e5";
  const faceX = player.facing === "left" ? -4 : player.facing === "right" ? 3 : -1;
  ctx.fillRect(Math.round(player.x + faceX), Math.round(player.y - 7), 2, 2);
  ctx.strokeStyle = "#fff4b8";
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(player.x - 9), Math.round(player.y - 14), 19, 27);

  const nearby = BUILDINGS.find(
    (building) => distanceToRect(player.x, player.y, building) < 78,
  );
  if (nearby) {
    const center = buildingCenter(nearby);
    drawPixelText(
      ctx,
      "E  ENTER",
      center.x,
      nearby.y + nearby.h + 24,
      "#fff4b8",
      12,
      "center",
    );
  }

  ctx.restore();

  const daylight =
    hour >= 7 && hour < 17
      ? 0
      : hour >= 17 && hour < 21
        ? (hour - 17 + minute / 60) * 0.08
        : hour >= 5 && hour < 7
          ? (7 - hour - minute / 60) * 0.16
          : 0.38;
  if (daylight > 0) {
    ctx.fillStyle = `rgba(20, 18, 55, ${daylight})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  const vignette = ctx.createRadialGradient(
    VIEW_W / 2,
    VIEW_H / 2,
    180,
    VIEW_W / 2,
    VIEW_H / 2,
    650,
  );
  vignette.addColorStop(0, "rgba(4,5,12,0)");
  vignette.addColorStop(1, "rgba(4,5,12,.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

export default function RhoosCity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine>(initialEngine());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const [revision, setRevision] = useState(0);
  const [panelTab, setPanelTab] = useState<PanelTab>("overview");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState("LOCAL SAVE READY");

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Engine>;
        const base = initialEngine();
        engineRef.current = {
          ...base,
          ...parsed,
          player: { ...base.player, ...parsed.player },
          camera: { ...base.camera, ...parsed.camera },
          businesses: { ...base.businesses, ...parsed.businesses },
          rules: parsed.rules ?? base.rules,
          events: parsed.events ?? base.events,
          elapsed: 0,
          uiAccumulator: 0,
          economyAccumulator: 0,
          paused: false,
        };
        setSaveStatus("CITY RESTORED");
        refresh();
      }
    } catch {
      setSaveStatus("NEW CITY FILE");
    }
  }, [refresh]);

  const saveGame = useCallback(() => {
    const engine = engineRef.current;
    const payload = {
      ...engine,
      elapsed: 0,
      uiAccumulator: 0,
      economyAccumulator: 0,
      paused: false,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    setSaveStatus(`SAVED ${clockParts(engine).text}`);
    window.setTimeout(() => setSaveStatus("AUTO-SAVE ON"), 1800);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(saveGame, 12000);
    return () => window.clearInterval(interval);
  }, [saveGame]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", " "].includes(
          key,
        )
      ) {
        event.preventDefault();
      }
      keysRef.current.add(key);
      if (key === " ") {
        engineRef.current.paused = !engineRef.current.paused;
        refresh();
      }
      if (key === "e") interact();
      if (key === "j") setPanelTab("jobs");
      if (key === "r") setRulesOpen((value) => !value);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  const completeJob = useCallback(() => {
    const engine = engineRef.current;
    if (!engine.activeJob) return;
    const job = JOBS.find((item) => item.id === engine.activeJob?.jobId);
    if (!job) return;
    engine.cash += job.pay;
    engine.reputation += job.reputation;
    engine.energy = clamp(engine.energy - 14, 0, 100);
    engine.jobsCompleted += 1;
    engine.businesses[job.buildingId].cash -= job.pay;
    engine.businesses[job.buildingId].output = clamp(
      engine.businesses[job.buildingId].output + 5,
      0,
      100,
    );
    addEvent(engine, `${job.title} shift complete. Paid ${formatMoney(job.pay)}.`);
    engine.activeJob = null;
    refresh();
  }, [refresh]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;
    let last = performance.now();

    const frame = (now: number) => {
      const engine = engineRef.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      engine.elapsed += dt;

      if (!engine.paused) {
        engine.simMinutes += dt * 3 * engine.speed;
        if (engine.simMinutes >= 1440) {
          engine.simMinutes -= 1440;
          engine.day += 1;
          engine.energy = clamp(engine.energy + 32, 0, 100);
          addEvent(engine, `Day ${String(engine.day).padStart(2, "0")} begins.`);
        }

        const keys = keysRef.current;
        let dx = 0;
        let dy = 0;
        if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
        if (keys.has("arrowright") || keys.has("d")) dx += 1;
        if (keys.has("arrowup") || keys.has("w")) dy -= 1;
        if (keys.has("arrowdown") || keys.has("s")) dy += 1;
        if (dx || dy) {
          const magnitude = Math.hypot(dx, dy);
          const velocity = 150 * dt;
          const nextX = clamp(engine.player.x + (dx / magnitude) * velocity, 12, MAP_WIDTH - 12);
          const nextY = clamp(engine.player.y + (dy / magnitude) * velocity, 12, MAP_HEIGHT - 12);
          if (!rectCollidesBuilding(nextX, engine.player.y)) engine.player.x = nextX;
          if (!rectCollidesBuilding(engine.player.x, nextY)) engine.player.y = nextY;
          if (Math.abs(dx) > Math.abs(dy)) engine.player.facing = dx > 0 ? "right" : "left";
          else engine.player.facing = dy > 0 ? "down" : "up";
        }

        if (engine.activeJob?.working) {
          engine.activeJob.progress += dt * engine.speed;
          const job = JOBS.find((item) => item.id === engine.activeJob?.jobId);
          if (job && engine.activeJob.progress >= job.duration) completeJob();
        }

        engine.economyAccumulator += dt * engine.speed;
        if (engine.economyAccumulator >= 4.5) {
          engine.economyAccumulator = 0;
          runEconomy(engine);
        }
      }

      engine.camera.x +=
        (clamp(engine.player.x - VIEW_W / 2, 0, MAP_WIDTH - VIEW_W) - engine.camera.x) *
        Math.min(1, dt * 6);
      engine.camera.y +=
        (clamp(engine.player.y - VIEW_H / 2, 0, MAP_HEIGHT - VIEW_H) - engine.camera.y) *
        Math.min(1, dt * 6);
      renderCity(context, engine);

      engine.uiAccumulator += dt;
      if (engine.uiAccumulator >= 0.25) {
        engine.uiAccumulator = 0;
        refresh();
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [completeJob, refresh]);

  const engine = engineRef.current;
  void revision;
  const selected =
    BUILDINGS.find((building) => building.id === engine.selectedId) ?? BUILDINGS[0];
  const selectedBusiness = engine.businesses[selected.id];
  const selectedJobs = JOBS.filter((job) => job.buildingId === selected.id);
  const activeJob = engine.activeJob
    ? JOBS.find((job) => job.id === engine.activeJob?.jobId)
    : null;
  const nearby = distanceToRect(engine.player.x, engine.player.y, selected) < 86;
  const time = clockParts(engine);
  const selectedOpen = isOpen(selected, time.hour);
  const owned = engine.properties.includes(selected.id);

  function interact() {
    const current = engineRef.current;
    const closest = BUILDINGS.map((building) => ({
      building,
      distance: distanceToRect(current.player.x, current.player.y, building),
    })).sort((a, b) => a.distance - b.distance)[0];
    if (!closest || closest.distance > 86) {
      addEvent(current, "No entrance nearby. Move closer to a building.");
      refresh();
      return;
    }
    current.selectedId = closest.building.id;
    const job = current.activeJob
      ? JOBS.find((item) => item.id === current.activeJob?.jobId)
      : null;
    if (job?.buildingId === closest.building.id && !current.activeJob?.working) {
      startShift();
    } else {
      setPanelTab("overview");
      addEvent(current, `Entered ${closest.building.name}.`);
      refresh();
    }
  }

  function acceptJob(job: Job) {
    const current = engineRef.current;
    if (current.reputation < job.requiredReputation) {
      addEvent(current, `Reputation ${job.requiredReputation} required for ${job.title}.`);
      refresh();
      return;
    }
    current.activeJob = { jobId: job.id, progress: 0, working: false };
    current.selectedId = job.buildingId;
    addEvent(current, `${job.title} accepted. Travel to the marked building.`);
    refresh();
  }

  function startShift() {
    const current = engineRef.current;
    if (!current.activeJob) return;
    const job = JOBS.find((item) => item.id === current.activeJob?.jobId);
    const building = BUILDINGS.find((item) => item.id === job?.buildingId);
    if (!job || !building) return;
    if (distanceToRect(current.player.x, current.player.y, building) >= 86) {
      addEvent(current, `Go to ${building.name} before starting the shift.`);
      refresh();
      return;
    }
    if (current.energy < 12) {
      addEvent(current, "Too exhausted. Rest until the next day.");
      refresh();
      return;
    }
    current.activeJob.working = true;
    current.shiftStarted = true;
    addEvent(current, `${job.title} shift started.`);
    refresh();
  }

  function buyProperty() {
    const current = engineRef.current;
    if (selected.price <= 0 || current.properties.includes(selected.id)) return;
    if (current.cash < selected.price) {
      addEvent(current, `Need ${formatMoney(selected.price - current.cash)} more to buy ${selected.name}.`);
      refresh();
      return;
    }
    current.cash -= selected.price;
    current.properties.push(selected.id);
    addEvent(current, `Property acquired: ${selected.name}. Revenue now pays dividends.`);
    refresh();
  }

  function upgradeBusiness() {
    const current = engineRef.current;
    const business = current.businesses[selected.id];
    const cost = 600 * business.level;
    if (!current.properties.includes(selected.id) || current.cash < cost) return;
    current.cash -= cost;
    business.level += 1;
    business.output = clamp(business.output + 12, 0, 120);
    business.demand = clamp(business.demand + 6, 0, 100);
    addEvent(current, `${selected.name} upgraded to level ${business.level}.`);
    refresh();
  }

  function toggleRule(ruleId: string) {
    const current = engineRef.current;
    const rule = current.rules.find((item) => item.id === ruleId);
    if (!rule) return;
    rule.enabled = !rule.enabled;
    addEvent(current, `${rule.title} ${rule.enabled ? "enabled" : "disabled"}.`);
    refresh();
  }

  function changeSpeed(speed: 1 | 3 | 8) {
    engineRef.current.speed = speed;
    engineRef.current.paused = false;
    refresh();
  }

  function moveTouch(direction: "up" | "down" | "left" | "right", pressed: boolean) {
    const key = direction === "up" ? "w" : direction === "down" ? "s" : direction === "left" ? "a" : "d";
    if (pressed) keysRef.current.add(key);
    else keysRef.current.delete(key);
  }

  function handleMapClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const scaleX = VIEW_W / bounds.width;
    const scaleY = VIEW_H / bounds.height;
    const worldX = (event.clientX - bounds.left) * scaleX + engine.camera.x;
    const worldY = (event.clientY - bounds.top) * scaleY + engine.camera.y;
    const clicked = BUILDINGS.find(
      (building) =>
        worldX >= building.x &&
        worldX <= building.x + building.w &&
        worldY >= building.y &&
        worldY <= building.y + building.h,
    );
    if (clicked) {
      engine.selectedId = clicked.id;
      setPanelTab("overview");
      refresh();
    }
  }

  const districtCounts = useMemo(
    () => ({
      businesses: BUILDINGS.filter(
        (building) => !["residential", "civic"].includes(building.kind),
      ).length,
      jobs: JOBS.length,
      residents: NPC_NAMES.length * 6,
    }),
    [],
  );

  const progress =
    activeJob && engine.activeJob
      ? clamp((engine.activeJob.progress / activeJob.duration) * 100, 0, 100)
      : 0;

  return (
    <main className="game-shell">
      <header className="command-bar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            R
          </div>
          <div>
            <p className="eyebrow">ROBINHOOD CHAIN / DISTRICT 01</p>
            <h1>RHOOS CITY</h1>
          </div>
        </div>
        <div className="top-stat time-stat">
          <span>DAY {String(engine.day).padStart(2, "0")}</span>
          <strong>{time.text}</strong>
          <small>{time.hour >= 18 || time.hour < 6 ? "NIGHT SHIFT" : "CITY HOURS"}</small>
        </div>
        <div className="top-stat">
          <span>WALLET</span>
          <strong>{formatMoney(engine.cash)}</strong>
          <small>RHOOS LOCAL</small>
        </div>
        <div className="top-stat">
          <span>REPUTATION</span>
          <strong>{String(engine.reputation).padStart(2, "0")}</strong>
          <small>{engine.reputation < 5 ? "NEW ARRIVAL" : engine.reputation < 15 ? "TRUSTED" : "CITY MAKER"}</small>
        </div>
        <div className="speed-controls" aria-label="Simulation speed">
          <button
            className={engine.paused ? "active" : ""}
            onClick={() => {
              engine.paused = !engine.paused;
              refresh();
            }}
            aria-label={engine.paused ? "Resume simulation" : "Pause simulation"}
          >
            {engine.paused ? "▶" : "Ⅱ"}
          </button>
          {([1, 3, 8] as const).map((speed) => (
            <button
              key={speed}
              className={!engine.paused && engine.speed === speed ? "active" : ""}
              onClick={() => changeSpeed(speed)}
            >
              {speed}×
            </button>
          ))}
        </div>
      </header>

      <section className="city-dashboard">
        <aside className="left-rail">
          <section className="rail-section mission-card">
            <div className="section-kicker">DAY ONE DIRECTIVE</div>
            <h2>Find your place in the machine.</h2>
            <div className="objective-list">
              <div className={engine.activeJob || engine.jobsCompleted > 0 ? "done" : ""}>
                <span>01</span>
                <p>Accept a city job</p>
              </div>
              <div className={engine.jobsCompleted > 0 ? "done" : ""}>
                <span>02</span>
                <p>Complete one shift</p>
              </div>
              <div className={engine.properties.length > 0 ? "done" : ""}>
                <span>03</span>
                <p>Purchase a property</p>
              </div>
            </div>
          </section>

          <section className="rail-section">
            <div className="section-heading">
              <span>CITY PULSE</span>
              <i className="live-dot" />
            </div>
            <MetricBar label="Employment" value={engine.employment} tone="cyan" />
            <MetricBar label="Power load" value={engine.powerLoad} tone="gold" />
            <MetricBar
              label="Energy"
              value={engine.energy}
              tone={engine.energy < 25 ? "pink" : "green"}
            />
            <div className="gdp-block">
              <span>DISTRICT OUTPUT</span>
              <strong>{formatMoney(engine.cityGDP)}</strong>
              <small>per cycle</small>
            </div>
          </section>

          <section className="rail-section activity-section">
            <div className="section-heading">
              <span>CITY WIRE</span>
              <small>LIVE</small>
            </div>
            <div className="event-feed">
              {engine.events.map((event, index) => {
                const [stamp, ...message] = event.split("  ");
                return (
                  <div key={`${event}-${index}`}>
                    <time>{stamp}</time>
                    <p>{message.join("  ")}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <button className="wide-button secondary" onClick={() => setHelpOpen(true)}>
            CONTROLS / CITY MANUAL
          </button>
        </aside>

        <section className="playfield-column">
          <div className="map-frame">
            <div className="map-topline">
              <span>LIVE CITY GRID // SECTOR {selected.kind.toUpperCase()}</span>
              <span>{engine.paused ? "SIMULATION PAUSED" : "SYSTEM NOMINAL"}</span>
            </div>
            <canvas
              ref={canvasRef}
              width={VIEW_W}
              height={VIEW_H}
              onClick={handleMapClick}
              aria-label="Playable map of Rhoos City. Use WASD or arrow keys to walk and E to interact."
              tabIndex={0}
            />
            <div className="canvas-corners" aria-hidden="true" />
            {activeJob && (
              <div className="active-contract">
                <div>
                  <span>ACTIVE CONTRACT</span>
                  <strong>{activeJob.title}</strong>
                  <small>
                    {engine.activeJob?.working
                      ? "SHIFT IN PROGRESS"
                      : `REPORT TO ${BUILDINGS.find((item) => item.id === activeJob.buildingId)?.shortName}`}
                  </small>
                </div>
                <div className="contract-progress">
                  <i style={{ width: `${progress}%` }} />
                </div>
                {!engine.activeJob?.working && (
                  <button onClick={startShift} disabled={!nearby || selected.id !== activeJob.buildingId}>
                    START SHIFT
                  </button>
                )}
              </div>
            )}
            <div className="touch-controls" aria-label="Touch movement controls">
              <button
                onPointerDown={() => moveTouch("up", true)}
                onPointerUp={() => moveTouch("up", false)}
                onPointerLeave={() => moveTouch("up", false)}
                aria-label="Move up"
              >
                ▲
              </button>
              <button
                onPointerDown={() => moveTouch("left", true)}
                onPointerUp={() => moveTouch("left", false)}
                onPointerLeave={() => moveTouch("left", false)}
                aria-label="Move left"
              >
                ◀
              </button>
              <button onClick={interact} className="touch-action" aria-label="Interact">
                E
              </button>
              <button
                onPointerDown={() => moveTouch("right", true)}
                onPointerUp={() => moveTouch("right", false)}
                onPointerLeave={() => moveTouch("right", false)}
                aria-label="Move right"
              >
                ▶
              </button>
              <button
                onPointerDown={() => moveTouch("down", true)}
                onPointerUp={() => moveTouch("down", false)}
                onPointerLeave={() => moveTouch("down", false)}
                aria-label="Move down"
              >
                ▼
              </button>
            </div>
          </div>

          <div className="economy-ticker">
            <span className="ticker-label">ECONOMY LOOP</span>
            <div className="ticker-flow">
              <b>ORE</b><i>→</i><b>STEEL</b><i>→</i><b>ELECTRONICS</b><i>→</i><b>FREIGHT</b><i>→</i><b>MARKET</b><i>→</i><b>WAGES</b>
            </div>
            <span className="ticker-status">FLOWING</span>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-hero" style={{ "--building-accent": selected.accent } as React.CSSProperties}>
            <div className="building-code">{selected.shortName.slice(0, 2)}</div>
            <div>
              <span>{KIND_LABEL[selected.kind]} / {selectedOpen ? "OPEN" : "CLOSED"}</span>
              <h2>{selected.name}</h2>
              <p>{selected.shortName}</p>
            </div>
          </div>
          <div className="inspector-tabs" role="tablist" aria-label="Building information">
            {(["overview", "jobs", "rules"] as PanelTab[]).map((tab) => (
              <button
                key={tab}
                className={panelTab === tab ? "active" : ""}
                onClick={() => setPanelTab(tab)}
                role="tab"
                aria-selected={panelTab === tab}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {panelTab === "overview" && (
            <div className="inspector-body">
              <p className="building-description">{selected.description}</p>
              <div className="status-grid">
                <Stat label="Inventory" value={`${Math.round(selectedBusiness.inventory)} u.`} />
                <Stat label="Workers" value={String(selectedBusiness.workers)} />
                <Stat label="Demand" value={`${Math.round(selectedBusiness.demand)}%`} />
                <Stat label="Treasury" value={formatMoney(selectedBusiness.cash)} />
              </div>
              <div className="building-meter">
                <div>
                  <span>PRODUCTION</span>
                  <b>{Math.round(selectedBusiness.output)}%</b>
                </div>
                <i>
                  <em style={{ width: `${clamp(selectedBusiness.output, 0, 100)}%` }} />
                </i>
              </div>
              <div className="property-card">
                <div>
                  <span>PROPERTY STATUS</span>
                  <strong>
                    {selected.price <= 0 ? "PUBLIC ASSET" : owned ? `OWNED / LV.${selectedBusiness.level}` : "AVAILABLE"}
                  </strong>
                </div>
                {selected.price > 0 && !owned && (
                  <>
                    <b>{formatMoney(selected.price)}</b>
                    <button onClick={buyProperty} disabled={engine.cash < selected.price}>
                      PURCHASE
                    </button>
                  </>
                )}
                {owned && (
                  <button
                    onClick={upgradeBusiness}
                    disabled={engine.cash < selectedBusiness.level * 600}
                  >
                    UPGRADE {formatMoney(selectedBusiness.level * 600)}
                  </button>
                )}
              </div>
              <div className={`proximity-note ${nearby ? "near" : ""}`}>
                <span>{nearby ? "YOU ARE AT THIS BUILDING" : "SELECTED REMOTELY"}</span>
                <small>{nearby ? "Press E to interact" : "Walk to the marked entrance"}</small>
              </div>
            </div>
          )}

          {panelTab === "jobs" && (
            <div className="inspector-body">
              <div className="panel-intro">
                <span>LOCAL JOB BOARD</span>
                <p>Work creates real output for this business and pays from its treasury.</p>
              </div>
              {selectedJobs.length ? (
                selectedJobs.map((job) => {
                  const locked = engine.reputation < job.requiredReputation;
                  const active = engine.activeJob?.jobId === job.id;
                  return (
                    <article className={`job-card ${active ? "active" : ""}`} key={job.id}>
                      <div>
                        <small>REP {job.requiredReputation}+</small>
                        <h3>{job.title}</h3>
                        <p>{job.description}</p>
                      </div>
                      <div className="job-pay">
                        <strong>{formatMoney(job.pay)}</strong>
                        <span>{job.duration}s shift</span>
                      </div>
                      <button
                        onClick={() => acceptJob(job)}
                        disabled={locked || Boolean(engine.activeJob)}
                      >
                        {active ? "ACCEPTED" : locked ? "LOCKED" : "ACCEPT JOB"}
                      </button>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">
                  <strong>NO OPEN SHIFTS</strong>
                  <p>This building is not hiring today. Try the market or industrial district.</p>
                </div>
              )}
              <button
                className="wide-button secondary"
                onClick={() => {
                  engine.selectedId = "harbor-market";
                  refresh();
                }}
              >
                FIND STARTER WORK
              </button>
            </div>
          )}

          {panelTab === "rules" && (
            <div className="inspector-body">
              <div className="panel-intro">
                <span>PROGRAMMABLE OPERATIONS</span>
                <p>Rules connect conditions in one business to actions across the city.</p>
              </div>
              {engine.rules.filter((rule) => rule.buildingId === selected.id).length ? (
                engine.rules
                  .filter((rule) => rule.buildingId === selected.id)
                  .map((rule) => (
                    <RuleCard key={rule.id} rule={rule} onToggle={() => toggleRule(rule.id)} />
                  ))
              ) : (
                <div className="empty-state">
                  <strong>NO LOCAL AUTOMATION</strong>
                  <p>This building is operated manually. Open the city rule matrix to see linked systems.</p>
                </div>
              )}
              <button className="wide-button primary" onClick={() => setRulesOpen(true)}>
                OPEN CITY RULE MATRIX
              </button>
            </div>
          )}

          <div className="inspector-footer">
            <span>{saveStatus}</span>
            <button onClick={saveGame}>SAVE CITY</button>
          </div>
        </aside>
      </section>

      <footer className="status-footer">
        <div>
          <span>POPULATION</span>
          <strong>{districtCounts.residents}</strong>
        </div>
        <div>
          <span>OPERATING BUSINESSES</span>
          <strong>{districtCounts.businesses}</strong>
        </div>
        <div>
          <span>AVAILABLE JOBS</span>
          <strong>{districtCounts.jobs}</strong>
        </div>
        <div>
          <span>PLAYER ASSETS</span>
          <strong>{engine.properties.length}</strong>
        </div>
        <p>WASD / ARROWS MOVE · E INTERACT · J JOBS · R RULES · SPACE PAUSE</p>
      </footer>

      {helpOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-window intro-modal" role="dialog" aria-modal="true" aria-labelledby="intro-title">
            <div className="modal-header">
              <span>RHOOS SYSTEM DISK / 1988</span>
              <button onClick={() => setHelpOpen(false)} aria-label="Close city manual">×</button>
            </div>
            <div className="intro-art" aria-hidden="true">
              <div className="sun-disc" />
              <div className="skyline-bars">
                {Array.from({ length: 13 }).map((_, index) => <i key={index} />)}
              </div>
              <strong>RHOOS<br />CITY</strong>
              <span>DISTRICT ONE</span>
            </div>
            <div className="intro-copy">
              <p className="eyebrow">A PROGRAMMABLE ECONOMIC CITY</p>
              <h2 id="intro-title">Arrive with ¥3,200.<br />Build a life from the city itself.</h2>
              <p>
                Walk to a business, accept a shift, watch resources become products,
                and turn wages into property. Every rule changes the machine.
              </p>
              <div className="manual-grid">
                <div><kbd>WASD</kbd><span>Walk the city</span></div>
                <div><kbd>E</kbd><span>Enter / work</span></div>
                <div><kbd>J</kbd><span>Open jobs</span></div>
                <div><kbd>R</kbd><span>Rules matrix</span></div>
              </div>
              <button className="start-button" onClick={() => setHelpOpen(false)}>
                ENTER DISTRICT ONE <span>→</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {rulesOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal-window rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
            <div className="modal-header">
              <span>TRANSACTION PAD / CITY AUTOMATION</span>
              <button onClick={() => setRulesOpen(false)} aria-label="Close rule matrix">×</button>
            </div>
            <div className="rules-heading">
              <div>
                <p className="eyebrow">RULE ENGINE V0.1</p>
                <h2 id="rules-title">Every building is a program.</h2>
              </div>
              <div className="rules-legend">
                <span><i className="green" />ACTIVE</span>
                <span><i />MANUAL</span>
              </div>
            </div>
            <div className="rule-matrix">
              {engine.rules.map((rule, index) => {
                const building = BUILDINGS.find((item) => item.id === rule.buildingId)!;
                return (
                  <article key={rule.id} className={rule.enabled ? "enabled" : ""}>
                    <div className="rule-index">{String(index + 1).padStart(2, "0")}</div>
                    <div className="rule-source">
                      <span>WHEN / {building.shortName}</span>
                      <strong>{rule.condition}</strong>
                    </div>
                    <div className="rule-arrow">THEN →</div>
                    <div className="rule-action">
                      <span>AUTOMATIC ACTION</span>
                      <strong>{rule.action}</strong>
                    </div>
                    <button
                      className={`toggle ${rule.enabled ? "on" : ""}`}
                      onClick={() => toggleRule(rule.id)}
                      aria-label={`${rule.enabled ? "Disable" : "Enable"} ${rule.title}`}
                    >
                      <i />
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="rules-footer">
              <p>Rules execute during each economy cycle. Changes apply immediately.</p>
              <button className="wide-button primary" onClick={() => setRulesOpen(false)}>RETURN TO CITY</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function MetricBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "gold" | "green" | "pink";
}) {
  return (
    <div className="metric-bar">
      <div>
        <span>{label}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <i>
        <em className={tone} style={{ width: `${clamp(value, 0, 100)}%` }} />
      </i>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RuleCard({ rule, onToggle }: { rule: RuleDefinition; onToggle: () => void }) {
  return (
    <article className={`mini-rule ${rule.enabled ? "enabled" : ""}`}>
      <div>
        <span>{rule.enabled ? "ACTIVE RULE" : "MANUAL"}</span>
        <h3>{rule.title}</h3>
      </div>
      <p>IF {rule.condition}</p>
      <strong>→ {rule.action}</strong>
      <button onClick={onToggle}>{rule.enabled ? "DISABLE" : "ENABLE"}</button>
    </article>
  );
}
