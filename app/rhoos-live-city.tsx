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
  HOOK_MODULES,
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
  type HookModule,
  type Job,
} from "./game-data";
import type { RhoosThreeEngine } from "./rhoos-three-engine";
import { RhoosSoundEngine } from "./rhoos-sound-engine";

const VIEW_W = 1280;
const VIEW_H = 720;
const HORIZON = 282;
const FOCAL = 690;
const CAMERA_HEIGHT = 46;
const SAVE_KEY = "rhoos-city-hooktech-v3";
const TAU = Math.PI * 2;

type Panel = null | "building" | "jobs" | "hooks" | "map";
type Weather = "CLEAR" | "MIST" | "RAIN";

type ActiveJob = {
  jobId: string;
  progress: number;
  working: boolean;
};

type HookPacket = {
  block: number;
  hook: string;
  message: string;
  color: string;
};

type WorkGame = {
  jobId: string;
  needle: number;
  direction: 1 | -1;
  target: number;
  score: number;
  attempts: number;
  timeLeft: number;
};

type Engine = {
  player: { x: number; y: number; angle: number; pitch: number };
  simMinutes: number;
  day: number;
  speed: 1 | 3 | 8;
  paused: boolean;
  cash: number;
  energy: number;
  reputation: number;
  selectedId: string;
  businesses: Record<string, BusinessState>;
  properties: string[];
  activeJob: ActiveJob | null;
  jobsCompleted: number;
  installedHooks: string[];
  disabledHooks: string[];
  hookPackets: HookPacket[];
  block: number;
  events: string[];
  cityGDP: number;
  employment: number;
  powerLoad: number;
  traffic: number;
  weather: Weather;
  economyAccumulator: number;
  uiAccumulator: number;
  elapsed: number;
  moving: boolean;
  sprinting: boolean;
};

type Projection = {
  x: number;
  y: number;
  depth: number;
  scale: number;
};

type GroundTile = {
  depth: number;
  points: Projection[];
  kind: "road" | "walk" | "ground";
  stripe: boolean;
};

function initialEngine(): Engine {
  const installedHooks = HOOK_MODULES.filter((hook) => hook.installedByDefault).map(
    (hook) => hook.id,
  );
  return {
    // Start looking east along Central Loop instead of directly into City Hall.
    // This gives the first frame a long city vista, visible traffic, and depth.
    player: { x: 970, y: 944, angle: 0, pitch: -0.03 },
    simMinutes: 6 * 60 + 52,
    day: 1,
    speed: 1,
    paused: false,
    cash: 3200,
    energy: 90,
    reputation: 0,
    selectedId: "city-hall",
    businesses: makeInitialBusinesses(),
    properties: [],
    activeJob: null,
    jobsCompleted: 0,
    installedHooks,
    disabledHooks: [],
    hookPackets: [
      {
        block: 48102,
        hook: "HK-01",
        message: "SUPPLY ROUTER LISTENING",
        color: "#67d7e5",
      },
      {
        block: 48101,
        hook: "HK-02",
        message: "MARKET SIGNAL BOUND",
        color: "#ff5d9e",
      },
    ],
    block: 48103,
    events: [
      "06:52  You arrived outside Rhoos City Hall.",
      "06:49  East-loop traffic signals synchronized.",
      "06:45  Starter shifts posted across District One.",
    ],
    cityGDP: 42800,
    employment: 76,
    powerLoad: 61,
    traffic: 42,
    weather: "MIST",
    economyAccumulator: 0,
    uiAccumulator: 0,
    elapsed: 0,
    moving: false,
    sprinting: false,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle: number) {
  while (angle > Math.PI) angle -= TAU;
  while (angle < -Math.PI) angle += TAU;
  return angle;
}

function formatMoney(value: number) {
  return `¥${Math.max(0, Math.round(value)).toLocaleString("en-US")}`;
}

function clockParts(engine: Engine) {
  const minutes = Math.floor(engine.simMinutes % 1440);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return {
    hour,
    minute,
    text: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function centerOf(building: Building) {
  return { x: building.x + building.w / 2, y: building.y + building.h / 2 };
}

function distanceToRect(x: number, y: number, building: Building) {
  const dx = Math.max(building.x - x, 0, x - building.x - building.w);
  const dy = Math.max(building.y - y, 0, y - building.y - building.h);
  return Math.hypot(dx, dy);
}

function collidesWithBuilding(x: number, y: number) {
  return BUILDINGS.some(
    (building) =>
      x > building.x - 12 &&
      x < building.x + building.w + 12 &&
      y > building.y - 12 &&
      y < building.y + building.h + 12,
  );
}

function isOpen(building: Building, hour: number) {
  const [start, end] = building.open;
  if (start === 0 && end === 24) return true;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function addEvent(engine: Engine, message: string) {
  engine.events = [`${clockParts(engine).text}  ${message}`, ...engine.events].slice(0, 6);
}

function addPacket(engine: Engine, hook: HookModule, message: string) {
  engine.hookPackets = [
    { block: engine.block++, hook: hook.code, message, color: hook.color },
    ...engine.hookPackets,
  ].slice(0, 6);
}

function hookActive(engine: Engine, id: string) {
  return engine.installedHooks.includes(id) && !engine.disabledHooks.includes(id);
}

function buildingHeight(building: Building) {
  const base: Record<Building["kind"], number> = {
    utility: 92,
    industry: 72,
    commerce: 84,
    finance: 126,
    civic: 112,
    residential: 138,
    transport: 68,
    entertainment: 96,
  };
  return base[building.kind] + (building.id.length % 3) * 9;
}

function shade(hex: string, amount: number) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const r = clamp((value >> 16) + amount, 0, 255);
  const g = clamp(((value >> 8) & 255) + amount, 0, 255);
  const b = clamp((value & 255) + amount, 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

function project(
  wx: number,
  wy: number,
  height: number,
  engine: Engine,
  bob = 0,
): Projection | null {
  const dx = wx - engine.player.x;
  const dy = wy - engine.player.y;
  const cosine = Math.cos(engine.player.angle);
  const sine = Math.sin(engine.player.angle);
  const depth = dx * cosine + dy * sine;
  if (depth < 10) return null;
  const side = -dx * sine + dy * cosine;
  const scale = FOCAL / depth;
  return {
    x: VIEW_W / 2 + side * scale,
    y: HORIZON + bob + (CAMERA_HEIGHT - height) * scale,
    depth,
    scale,
  };
}

function projectQuad(
  points: Array<[number, number, number]>,
  engine: Engine,
  bob = 0,
) {
  const projected = points.map(([x, y, height]) => project(x, y, height, engine, bob));
  if (projected.some((point) => point === null)) return null;
  return projected as Projection[];
}

function polygon(
  context: CanvasRenderingContext2D,
  points: Projection[],
  fill: string,
  stroke?: string,
) {
  if (!points.length) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index++) {
    context.lineTo(points[index].x, points[index].y);
  }
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = 1;
    context.stroke();
  }
}

function getFocusedBuilding(engine: Engine) {
  let best: { building: Building; score: number; distance: number } | null = null;
  for (const building of BUILDINGS) {
    const center = centerOf(building);
    const dx = center.x - engine.player.x;
    const dy = center.y - engine.player.y;
    const distance = distanceToRect(engine.player.x, engine.player.y, building);
    const angle = Math.atan2(dy, dx);
    const difference = Math.abs(normalizeAngle(angle - engine.player.angle));
    if (distance > 245 || difference > 0.52) continue;
    const score = difference * 170 + distance;
    if (!best || score < best.score) best = { building, score, distance };
  }
  return best;
}

function getNpcPosition(index: number, simMinutes: number) {
  const hour = (simMinutes % 1440) / 60;
  const homes = BUILDINGS.filter((building) => building.kind === "residential");
  const workplaces = BUILDINGS.filter(
    (building) => !["residential", "entertainment"].includes(building.kind),
  );
  const home = centerOf(homes[index % homes.length]);
  const work = centerOf(workplaces[(index * 5 + 1) % workplaces.length]);
  const leisure = centerOf(
    BUILDINGS.find((building) =>
      index % 3 === 0
        ? building.id === "moon-arcade"
        : index % 2 === 0
          ? building.id === "harbor-market"
          : building.id === "sakura-cafe",
    )!,
  );

  let start = home;
  let end = home;
  let progress = 0;
  let status = "HOME";
  if (hour >= 6.5 && hour < 8) {
    start = home;
    end = work;
    progress = (hour - 6.5) / 1.5;
    status = "COMMUTE";
  } else if (hour >= 8 && hour < 17) {
    start = work;
    end = work;
    status = "WORK";
  } else if (hour >= 17 && hour < 18.5) {
    start = work;
    end = leisure;
    progress = (hour - 17) / 1.5;
    status = "CITY";
  } else if (hour >= 18.5 && hour < 20.5) {
    start = leisure;
    end = leisure;
    status = "LEISURE";
  } else if (hour >= 20.5 && hour < 22) {
    start = leisure;
    end = home;
    progress = (hour - 20.5) / 1.5;
    status = "RETURN";
  }

  progress = clamp(progress, 0, 1);
  const bendFirst = index % 2 === 0;
  if (progress < 0.5) {
    const part = progress * 2;
    return bendFirst
      ? { x: start.x + (end.x - start.x) * part, y: start.y, status }
      : { x: start.x, y: start.y + (end.y - start.y) * part, status };
  }
  const part = (progress - 0.5) * 2;
  return bendFirst
    ? { x: end.x, y: start.y + (end.y - start.y) * part, status }
    : { x: start.x + (end.x - start.x) * part, y: end.y, status };
}

function getCarPosition(index: number, engine: Engine) {
  const horizontal = index < 16;
  const direction = index % 2 === 0 ? 1 : -1;
  if (horizontal) {
    const road = ROAD_Y[index % ROAD_Y.length];
    const raw =
      (engine.elapsed * (42 + (index % 4) * 8) + index * 143) % MAP_WIDTH;
    return {
      x: direction > 0 ? raw : MAP_WIDTH - raw,
      y: road + (direction > 0 ? -14 : 14),
      horizontal: true,
      color: CAR_COLORS[index % CAR_COLORS.length],
    };
  }
  const road = ROAD_X[index % ROAD_X.length];
  const raw =
    (engine.elapsed * (37 + (index % 3) * 9) + index * 181) % MAP_HEIGHT;
  return {
    x: road + (direction > 0 ? 14 : -14),
    y: direction > 0 ? raw : MAP_HEIGHT - raw,
    horizontal: false,
    color: CAR_COLORS[index % CAR_COLORS.length],
  };
}

function drawSky(context: CanvasRenderingContext2D, engine: Engine) {
  const { hour, minute } = clockParts(engine);
  const decimalHour = hour + minute / 60;
  const isNight = decimalHour < 5.5 || decimalHour > 19;
  const isSunset =
    (decimalHour >= 17 && decimalHour <= 19) ||
    (decimalHour >= 5.5 && decimalHour <= 7);
  const sky = context.createLinearGradient(0, 0, 0, HORIZON + 90);
  if (isNight) {
    sky.addColorStop(0, "#080b20");
    sky.addColorStop(0.65, "#161a40");
    sky.addColorStop(1, "#3b244c");
  } else if (isSunset) {
    sky.addColorStop(0, "#202b52");
    sky.addColorStop(0.58, "#b34e72");
    sky.addColorStop(1, "#f09a69");
  } else {
    sky.addColorStop(0, "#4f84aa");
    sky.addColorStop(0.58, "#83b8c6");
    sky.addColorStop(1, "#d3c5a4");
  }
  context.fillStyle = sky;
  context.fillRect(0, 0, VIEW_W, HORIZON + 100);

  if (isNight) {
    context.fillStyle = "#f6e8b0";
    for (let index = 0; index < 38; index++) {
      const x = (index * 193 + 47) % VIEW_W;
      const y = (index * 71 + 29) % 220;
      context.globalAlpha = 0.35 + ((index * 17) % 60) / 100;
      context.fillRect(x, y, index % 4 === 0 ? 2 : 1, index % 4 === 0 ? 2 : 1);
    }
    context.globalAlpha = 1;
  }

  const celestialX = ((decimalHour - 6) / 14) * VIEW_W;
  const celestialY = 205 - Math.sin(((decimalHour - 6) / 14) * Math.PI) * 145;
  context.beginPath();
  context.arc(
    isNight ? VIEW_W - ((decimalHour % 12) / 12) * VIEW_W : celestialX,
    isNight ? 92 : celestialY,
    isNight ? 24 : 34,
    0,
    TAU,
  );
  context.fillStyle = isNight ? "#dce8f5" : "#f8d66d";
  context.fill();

  context.fillStyle = isNight ? "#10142a" : "#657b82";
  for (let index = 0; index < 22; index++) {
    const x = index * 70 - ((engine.player.angle * 190) % 70);
    const height = 42 + ((index * 31) % 90);
    context.fillRect(x, HORIZON - height, 54, height);
    if (index % 4 === 0) context.fillRect(x + 19, HORIZON - height - 34, 8, 34);
  }
}

function drawGround(context: CanvasRenderingContext2D, engine: Engine, bob: number) {
  context.fillStyle = "#172124";
  context.fillRect(0, HORIZON, VIEW_W, VIEW_H - HORIZON);
  const tiles: GroundTile[] = [];
  const size = 80;
  const minX = Math.floor((engine.player.x - 1180) / size) * size;
  const maxX = Math.ceil((engine.player.x + 1180) / size) * size;
  const minY = Math.floor((engine.player.y - 1180) / size) * size;
  const maxY = Math.ceil((engine.player.y + 1180) / size) * size;

  for (let x = minX; x < maxX; x += size) {
    for (let y = minY; y < maxY; y += size) {
      if (x < 0 || y < 0 || x > MAP_WIDTH || y > MAP_HEIGHT) continue;
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      const points = projectQuad(
        [
          [x, y, 0],
          [x + size, y, 0],
          [x + size, y + size, 0],
          [x, y + size, 0],
        ],
        engine,
        bob,
      );
      if (!points) continue;
      const depth = points.reduce((sum, point) => sum + point.depth, 0) / points.length;
      if (depth > 1350) continue;
      const road =
        ROAD_X.some((roadX) => Math.abs(centerX - roadX) < ROAD_WIDTH / 2) ||
        ROAD_Y.some((roadY) => Math.abs(centerY - roadY) < ROAD_WIDTH / 2);
      const walk =
        ROAD_X.some((roadX) => Math.abs(centerX - roadX) < ROAD_WIDTH / 2 + 32) ||
        ROAD_Y.some((roadY) => Math.abs(centerY - roadY) < ROAD_WIDTH / 2 + 32);
      const stripe =
        road &&
        ((ROAD_X.some((roadX) => Math.abs(centerX - roadX) < 13) &&
          Math.floor(centerY / size) % 2 === 0) ||
          (ROAD_Y.some((roadY) => Math.abs(centerY - roadY) < 13) &&
            Math.floor(centerX / size) % 2 === 0));
      tiles.push({
        depth,
        points,
        kind: road ? "road" : walk ? "walk" : "ground",
        stripe,
      });
    }
  }

  tiles.sort((a, b) => b.depth - a.depth);
  for (const tile of tiles) {
    const fog = clamp(tile.depth / 1500, 0, 0.55);
    const fill =
      tile.kind === "road"
        ? `rgba(31, 39, 48, ${1 - fog * 0.3})`
        : tile.kind === "walk"
          ? `rgba(72, 76, 77, ${1 - fog * 0.35})`
          : `rgba(30, 48, 43, ${1 - fog * 0.35})`;
    polygon(context, tile.points, fill, tile.kind === "road" ? "#2d3943" : "#253b37");
    if (tile.stripe) {
      const [a, b, c, d] = tile.points;
      polygon(
        context,
        [
          { ...a, x: a.x * 0.47 + b.x * 0.53, y: a.y * 0.47 + b.y * 0.53 },
          { ...b, x: a.x * 0.43 + b.x * 0.57, y: a.y * 0.43 + b.y * 0.57 },
          { ...c, x: d.x * 0.43 + c.x * 0.57, y: d.y * 0.43 + c.y * 0.57 },
          { ...d, x: d.x * 0.47 + c.x * 0.53, y: d.y * 0.47 + c.y * 0.53 },
        ],
        "rgba(244, 211, 94, .55)",
      );
    }
  }
}

function drawBuildings(context: CanvasRenderingContext2D, engine: Engine, bob: number) {
  const sorted = BUILDINGS.map((building) => {
    const center = centerOf(building);
    const dx = center.x - engine.player.x;
    const dy = center.y - engine.player.y;
    return { building, distance: Math.hypot(dx, dy) };
  })
    .filter((item) => item.distance < 1500)
    .sort((a, b) => b.distance - a.distance);

  const night = clockParts(engine).hour >= 18 || clockParts(engine).hour < 6;
  for (const { building } of sorted) {
    const height = buildingHeight(building);
    const corners: Array<[number, number]> = [
      [building.x, building.y],
      [building.x + building.w, building.y],
      [building.x + building.w, building.y + building.h],
      [building.x, building.y + building.h],
    ];
    const ground = corners.map(([x, y]) => project(x, y, 0, engine, bob));
    const top = corners.map(([x, y]) => project(x, y, height, engine, bob));
    if (ground.some((point) => !point) || top.some((point) => !point)) continue;
    const g = ground as Projection[];
    const t = top as Projection[];

    const faces = corners.map((_, index) => {
      const next = (index + 1) % 4;
      return {
        depth: (g[index].depth + g[next].depth) / 2,
        points: [g[index], g[next], t[next], t[index]],
        color: shade(building.color, index % 2 === 0 ? -6 : 10),
      };
    });
    faces.sort((a, b) => b.depth - a.depth);
    for (const face of faces) polygon(context, face.points, face.color, "#151b25");
    polygon(context, t, shade(building.color, 20), "#1a202b");

    const center = centerOf(building);
    const sign = project(center.x, center.y, height * 0.56, engine, bob);
    if (!sign || sign.depth > 1050) continue;
    const signWidth = clamp(building.w * sign.scale * 0.42, 22, 150);
    const signHeight = clamp(20 * sign.scale, 8, 30);
    context.fillStyle = "rgba(10, 13, 22, .86)";
    context.fillRect(
      Math.round(sign.x - signWidth / 2),
      Math.round(sign.y - signHeight / 2),
      Math.round(signWidth),
      Math.round(signHeight),
    );
    context.strokeStyle = building.accent;
    context.lineWidth = clamp(sign.scale * 1.5, 1, 3);
    context.strokeRect(
      Math.round(sign.x - signWidth / 2),
      Math.round(sign.y - signHeight / 2),
      Math.round(signWidth),
      Math.round(signHeight),
    );
    if (signWidth > 45) {
      context.fillStyle = building.accent;
      context.font = `700 ${Math.round(clamp(11 * sign.scale, 8, 17))}px "Courier New"`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        building.shortName,
        Math.round(sign.x),
        Math.round(sign.y + 1),
        signWidth - 7,
      );
    }

    const windowPoint = project(center.x, center.y, height * 0.78, engine, bob);
    if (windowPoint && windowPoint.depth < 760) {
      const rows = building.kind === "residential" ? 4 : 2;
      const cols = clamp(Math.floor(building.w / 55), 3, 7);
      const gap = clamp(16 * windowPoint.scale, 7, 24);
      const winW = clamp(8 * windowPoint.scale, 3, 12);
      const winH = clamp(6 * windowPoint.scale, 2, 9);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const lit = night && (row + col + building.id.length) % 3 !== 0;
          context.fillStyle = lit ? "#f4d978" : "rgba(57, 92, 108, .66)";
          context.fillRect(
            windowPoint.x + (col - (cols - 1) / 2) * gap - winW / 2,
            windowPoint.y + row * (winH + 5),
            winW,
            winH,
          );
        }
      }
    }
  }
}

function drawCityLife(context: CanvasRenderingContext2D, engine: Engine, bob: number) {
  const entities: Array<{
    type: "car" | "npc";
    depth: number;
    projection: Projection;
    color: string;
    label?: string;
  }> = [];
  for (let index = 0; index < 26; index++) {
    const car = getCarPosition(index, engine);
    const projection = project(car.x, car.y, 8, engine, bob);
    if (projection && projection.depth < 900) {
      entities.push({
        type: "car",
        depth: projection.depth,
        projection,
        color: car.color,
      });
    }
  }
  for (let index = 0; index < NPC_NAMES.length; index++) {
    const npc = getNpcPosition(index, engine.simMinutes);
    const projection = project(npc.x, npc.y, 0, engine, bob);
    if (projection && projection.depth < 700) {
      entities.push({
        type: "npc",
        depth: projection.depth,
        projection,
        color: index % 3 === 0 ? "#ff8fab" : index % 3 === 1 ? "#67d7e5" : "#f4d35e",
        label: projection.depth < 120 ? NPC_NAMES[index].split(" ")[0] : undefined,
      });
    }
  }
  entities.sort((a, b) => b.depth - a.depth);

  for (const entity of entities) {
    const point = entity.projection;
    if (entity.type === "car") {
      const width = clamp(26 * point.scale, 5, 72);
      const height = clamp(13 * point.scale, 3, 34);
      context.fillStyle = "#0b0e15";
      context.fillRect(point.x - width / 2 - 2, point.y - height - 2, width + 4, height + 4);
      context.fillStyle = entity.color;
      context.fillRect(point.x - width / 2, point.y - height, width, height);
      context.fillStyle = "#bce3ed";
      context.fillRect(point.x - width * 0.18, point.y - height * 0.88, width * 0.36, height * 0.42);
      context.fillStyle = "#fff0a5";
      context.fillRect(point.x - width / 2, point.y - height * 0.65, 2, 3);
      context.fillRect(point.x + width / 2 - 2, point.y - height * 0.65, 2, 3);
    } else {
      const height = clamp(22 * point.scale, 6, 68);
      const width = height * 0.34;
      context.fillStyle = "#080a11";
      context.fillRect(point.x - width / 2 - 2, point.y - height - 2, width + 4, height + 4);
      context.fillStyle = entity.color;
      context.fillRect(point.x - width / 2, point.y - height * 0.7, width, height * 0.65);
      context.fillStyle = "#edc4a0";
      context.beginPath();
      context.arc(point.x, point.y - height * 0.85, width * 0.42, 0, TAU);
      context.fill();
      if (entity.label) {
        context.font = '700 10px "Courier New"';
        context.textAlign = "center";
        context.fillStyle = "#f5f0df";
        context.fillText(entity.label, point.x, point.y - height - 9);
      }
    }
  }
}

function drawWeather(context: CanvasRenderingContext2D, engine: Engine) {
  if (engine.weather === "MIST") {
    const mist = context.createLinearGradient(0, HORIZON - 80, 0, VIEW_H);
    mist.addColorStop(0, "rgba(175, 198, 204, .12)");
    mist.addColorStop(1, "rgba(175, 198, 204, 0)");
    context.fillStyle = mist;
    context.fillRect(0, HORIZON - 100, VIEW_W, 330);
  }
  if (engine.weather === "RAIN") {
    context.strokeStyle = "rgba(170, 213, 235, .38)";
    context.lineWidth = 1;
    for (let index = 0; index < 90; index++) {
      const x = (index * 97 + engine.elapsed * 340) % (VIEW_W + 80) - 40;
      const y = (index * 53 + engine.elapsed * 510) % VIEW_H;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - 9, y + 24);
      context.stroke();
    }
  }
}

function drawMinimap(context: CanvasRenderingContext2D, engine: Engine) {
  const width = 174;
  const height = 124;
  const x = VIEW_W - width - 18;
  const y = 72;
  context.fillStyle = "rgba(9, 12, 20, .78)";
  context.fillRect(x, y, width, height);
  context.strokeStyle = "#566178";
  context.strokeRect(x, y, width, height);
  context.fillStyle = "#25303a";
  for (const roadX of ROAD_X) {
    context.fillRect(x + (roadX / MAP_WIDTH) * width - 3, y, 6, height);
  }
  for (const roadY of ROAD_Y) {
    context.fillRect(x, y + (roadY / MAP_HEIGHT) * height - 3, width, 6);
  }
  context.save();
  context.translate(
    x + (engine.player.x / MAP_WIDTH) * width,
    y + (engine.player.y / MAP_HEIGHT) * height,
  );
  context.rotate(engine.player.angle);
  context.fillStyle = "#ff5d9e";
  context.beginPath();
  context.moveTo(8, 0);
  context.lineTo(-5, -5);
  context.lineTo(-5, 5);
  context.closePath();
  context.fill();
  context.restore();
  context.font = '700 8px "Courier New"';
  context.textAlign = "left";
  context.fillStyle = "#67d7e5";
  context.fillText("DISTRICT 01 / LIVE", x + 7, y + 12);
}

function renderWorld(context: CanvasRenderingContext2D, engine: Engine) {
  context.clearRect(0, 0, VIEW_W, VIEW_H);
  const bob = engine.moving ? Math.sin(engine.elapsed * (engine.sprinting ? 13 : 9)) * 4 : 0;
  drawSky(context, engine);
  drawGround(context, engine, bob);
  drawBuildings(context, engine, bob);
  drawCityLife(context, engine, bob);
  drawWeather(context, engine);

  const focused = getFocusedBuilding(engine);
  context.strokeStyle = focused ? focused.building.accent : "rgba(245, 240, 223, .65)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(VIEW_W / 2 - 13, VIEW_H / 2);
  context.lineTo(VIEW_W / 2 - 4, VIEW_H / 2);
  context.moveTo(VIEW_W / 2 + 4, VIEW_H / 2);
  context.lineTo(VIEW_W / 2 + 13, VIEW_H / 2);
  context.moveTo(VIEW_W / 2, VIEW_H / 2 - 13);
  context.lineTo(VIEW_W / 2, VIEW_H / 2 - 4);
  context.moveTo(VIEW_W / 2, VIEW_H / 2 + 4);
  context.lineTo(VIEW_W / 2, VIEW_H / 2 + 13);
  context.stroke();

  if (focused) {
    const labelWidth = 250;
    context.fillStyle = "rgba(9, 12, 20, .88)";
    context.fillRect(VIEW_W / 2 - labelWidth / 2, VIEW_H / 2 + 28, labelWidth, 46);
    context.strokeStyle = focused.building.accent;
    context.strokeRect(VIEW_W / 2 - labelWidth / 2, VIEW_H / 2 + 28, labelWidth, 46);
    context.textAlign = "center";
    context.fillStyle = focused.building.accent;
    context.font = '700 13px "Courier New"';
    context.fillText(focused.building.name.toUpperCase(), VIEW_W / 2, VIEW_H / 2 + 47);
    context.fillStyle = "#f5f0df";
    context.font = '700 9px "Courier New"';
    context.fillText(
      focused.distance < 105 ? "[ E ] INTERACT" : `${Math.round(focused.distance)}m`,
      VIEW_W / 2,
      VIEW_H / 2 + 63,
    );
  }

  drawMinimap(context, engine);

  const deckBob = engine.moving ? Math.sin(engine.elapsed * 7) * 5 : 0;
  context.save();
  context.translate(VIEW_W - 185, VIEW_H - 95 + deckBob);
  context.rotate(-0.08);
  context.fillStyle = "#0b0f18";
  context.fillRect(-4, -4, 170, 112);
  context.fillStyle = "#1b2330";
  context.fillRect(0, 0, 162, 104);
  context.strokeStyle = "#67d7e5";
  context.lineWidth = 2;
  context.strokeRect(8, 8, 146, 88);
  context.fillStyle = "#67d7e5";
  context.font = '700 10px "Courier New"';
  context.textAlign = "left";
  context.fillText("HOOKTECH DECK", 16, 26);
  context.fillStyle = "#65d6a6";
  context.fillRect(16, 36, 7, 7);
  context.fillStyle = "#f5f0df";
  context.font = '700 8px "Courier New"';
  context.fillText(`${engine.installedHooks.length} MODULES BOUND`, 29, 43);
  context.fillStyle = "#ff5d9e";
  context.fillText(`BLOCK ${engine.block}`, 16, 61);
  context.fillStyle = "#8992a7";
  context.fillText("H  OPEN MATRIX", 16, 80);
  context.restore();

  const vignette = context.createRadialGradient(
    VIEW_W / 2,
    VIEW_H / 2,
    230,
    VIEW_W / 2,
    VIEW_H / 2,
    760,
  );
  vignette.addColorStop(0, "rgba(4, 6, 12, 0)");
  vignette.addColorStop(1, "rgba(4, 6, 12, .58)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, VIEW_W, VIEW_H);
}

function runEconomy(engine: Engine) {
  const business = engine.businesses;
  const power = business["hikari-power"];
  const mine = business["north-mine"];
  const warehouse = business["kiso-warehouse"];
  const steel = business["yamato-steel"];
  const electronics = business["nami-electronics"];
  const freight = business["freight-depot"];
  const market = business["harbor-market"];
  const cafe = business["sakura-cafe"];
  const hour = clockParts(engine).hour;
  const installed = HOOK_MODULES.filter((hook) => hookActive(engine, hook.id));

  engine.traffic = clamp(
    34 +
      Math.sin(engine.elapsed / 15) * 13 +
      (hour >= 7 && hour <= 9 ? 22 : 0) +
      (hour >= 16 && hour <= 18 ? 19 : 0),
    12,
    96,
  );
  engine.powerLoad = clamp(
    55 + steel.output * 0.19 + electronics.output * 0.18 + Math.sin(engine.elapsed / 11) * 8,
    38,
    98,
  );
  power.output = Math.round(72 + Math.sin(engine.elapsed / 12) * 9);
  power.cash += Math.round(engine.powerLoad);
  mine.inventory = clamp(mine.inventory + 5, 0, 140);
  warehouse.inventory = clamp(warehouse.inventory + 3, 0, 150);

  if (mine.inventory >= 4 && power.output > 44) {
    mine.inventory -= 4;
    steel.inventory = clamp(steel.inventory + 7, 0, 140);
    steel.cash += 54;
  }
  if (steel.inventory >= 5) {
    steel.inventory -= 5;
    electronics.inventory = clamp(electronics.inventory + 8, 0, 140);
    electronics.cash += 74;
  }
  if (electronics.inventory >= 4) {
    electronics.inventory -= 4;
    market.inventory = clamp(market.inventory + 4, 0, 130);
    freight.cash += 26;
  }
  const sales = Math.min(market.inventory, Math.max(2, Math.round(market.demand / 15)));
  market.inventory -= sales;
  market.cash += sales * 39;
  cafe.cash += Math.round(cafe.demand * 1.6);

  const supplyHook = HOOK_MODULES.find((hook) => hook.id === "supply-router")!;
  if (hookActive(engine, "supply-router") && steel.inventory < 18 && warehouse.inventory > 10) {
    warehouse.inventory -= 10;
    steel.inventory += 12;
    addPacket(engine, supplyHook, "12 ORE → YAMATO STEEL");
  }
  const marketHook = HOOK_MODULES.find((hook) => hook.id === "dynamic-market")!;
  if (hookActive(engine, "dynamic-market")) {
    market.demand = clamp(market.demand + (hour >= 17 ? 4 : -1), 28, 96);
    addPacket(engine, marketHook, `DEMAND SET ${Math.round(market.demand)}%`);
  }
  const trafficHook = HOOK_MODULES.find((hook) => hook.id === "traffic-oracle")!;
  if (hookActive(engine, "traffic-oracle")) {
    freight.output = clamp(freight.output + (engine.traffic > 70 ? 2 : 5), 0, 100);
    addPacket(engine, trafficHook, `ROUTE SAVED ${Math.round(100 - engine.traffic / 3)} SEC`);
  }
  const gridHook = HOOK_MODULES.find((hook) => hook.id === "grid-guard")!;
  if (hookActive(engine, "grid-guard") && engine.powerLoad > 82) {
    power.output = clamp(power.output + 18, 0, 120);
    power.cash -= 80;
    addPacket(engine, gridHook, "RESERVE +18MW RELEASED");
  }

  const treasuryHook = HOOK_MODULES.find((hook) => hook.id === "treasury-split")!;
  for (const propertyId of engine.properties) {
    const owned = business[propertyId];
    if (!owned) continue;
    const dividend = Math.round(15 + owned.level * 9 + owned.demand / 8);
    if (hookActive(engine, "treasury-split")) {
      engine.cash += Math.round(dividend * 0.6);
      owned.cash += Math.round(dividend * 0.4);
      owned.output = clamp(owned.output + 0.25, 0, 100);
      if (engine.block % 4 === 0) addPacket(engine, treasuryHook, "60/40 REVENUE SPLIT");
    } else {
      engine.cash += dividend;
    }
  }

  engine.cityGDP = Math.round(
    Object.values(business).reduce(
      (sum, item) => sum + item.cash * 0.22 + item.output * 18,
      0,
    ),
  );
  engine.employment = clamp(
    Math.round(
      62 +
        Object.values(business).reduce((sum, item) => sum + item.workers, 0) / 8,
    ),
    60,
    97,
  );

  if (installed.length && engine.block % 5 === 0) {
    const hook = installed[engine.block % installed.length];
    addPacket(engine, hook, "STATE VERIFIED / NO ACTION");
  }
}

export default function RhoosLiveCity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine>(initialEngine());
  const keysRef = useRef<Set<string>>(new Set());
  const frameRef = useRef<number | null>(null);
  const threeRef = useRef<RhoosThreeEngine | null>(null);
  const soundRef = useRef<RhoosSoundEngine | null>(null);
  const [revision, setRevision] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [introOpen, setIntroOpen] = useState(true);
  const [audioOn, setAudioOn] = useState(true);
  const [volume, setVolume] = useState(0.46);
  const [workGame, setWorkGame] = useState<WorkGame | null>(null);
  const [saveLabel, setSaveLabel] = useState("AUTO-SAVE READY");

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    soundRef.current = new RhoosSoundEngine();
    soundRef.current.setVolume(volume);
    return () => {
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    soundRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as Partial<Engine>;
        const base = initialEngine();
        engineRef.current = {
          ...base,
          ...saved,
          player: { ...base.player, ...saved.player },
          businesses: { ...base.businesses, ...saved.businesses },
          installedHooks: saved.installedHooks ?? base.installedHooks,
          disabledHooks: saved.disabledHooks ?? [],
          hookPackets: saved.hookPackets ?? base.hookPackets,
          events: saved.events ?? base.events,
          elapsed: 0,
          economyAccumulator: 0,
          uiAccumulator: 0,
          paused: false,
        };
        setSaveLabel("CITY RESTORED");
        refresh();
      }
    } catch {
      setSaveLabel("NEW CITY FILE");
    }
  }, [refresh]);

  const saveGame = useCallback(() => {
    const engine = engineRef.current;
    const payload = {
      ...engine,
      elapsed: 0,
      economyAccumulator: 0,
      uiAccumulator: 0,
      paused: false,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    setSaveLabel(`SAVED ${clockParts(engine).text}`);
    window.setTimeout(() => setSaveLabel("AUTO-SAVE ON"), 1600);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(saveGame, 14000);
    return () => window.clearInterval(interval);
  }, [saveGame]);

  useEffect(() => {
    if (!workGame) return;
    const interval = window.setInterval(() => {
      setWorkGame((current) => {
        if (!current) return null;
        let needle = current.needle + current.direction * 2.8;
        let direction = current.direction;
        if (needle >= 100) {
          needle = 100;
          direction = -1;
        } else if (needle <= 0) {
          needle = 0;
          direction = 1;
        }
        const timeLeft = Math.max(0, current.timeLeft - 0.05);
        if (timeLeft <= 0) {
          addEvent(engineRef.current, "Shift console timed out. Contract remains active.");
          soundRef.current?.blip("error");
          return null;
        }
        return { ...current, needle, direction, timeLeft };
      });
    }, 50);
    return () => window.clearInterval(interval);
  }, [workGame?.jobId]);

  const interact = useCallback(() => {
    const engine = engineRef.current;
    const focused = getFocusedBuilding(engine);
    const nearest = BUILDINGS.map((building) => ({
      building,
      distance: distanceToRect(engine.player.x, engine.player.y, building),
    })).sort((a, b) => a.distance - b.distance)[0];
    const target =
      focused && focused.distance < 115
        ? focused
        : nearest && nearest.distance < 80
          ? { building: nearest.building, distance: nearest.distance }
          : null;
    if (!target) {
      addEvent(engine, "No interface in range. Face a building and move closer.");
      soundRef.current?.blip("error");
      refresh();
      return;
    }
    engine.selectedId = target.building.id;
    const activeJob = engine.activeJob
      ? JOBS.find((job) => job.id === engine.activeJob?.jobId)
      : null;
    if (
      activeJob?.buildingId === target.building.id &&
      engine.activeJob &&
      !engine.activeJob.working
    ) {
      setPanel(null);
      setWorkGame({
        jobId: activeJob.id,
        needle: 4,
        direction: 1,
        target: 42,
        score: 0,
        attempts: 0,
        timeLeft: 22,
      });
      soundRef.current?.blip("interact");
      addEvent(engine, `${activeJob.title} work console opened.`);
    } else {
      soundRef.current?.blip("interact");
      addEvent(engine, `${target.building.name} terminal connected.`);
      setPanel("building");
    }
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "q",
          "e",
          "f",
          "h",
          "j",
          "m",
          " ",
          "arrowleft",
          "arrowright",
          "arrowup",
          "arrowdown",
          "shift",
        ].includes(key)
      ) {
        event.preventDefault();
      }
      keysRef.current.add(key);
      if (event.repeat) return;
      if (key === "e" || key === "f") interact();
      if (key === "h") setPanel((current) => (current === "hooks" ? null : "hooks"));
      if (key === "j") setPanel((current) => (current === "jobs" ? null : "jobs"));
      if (key === "m") setPanel((current) => (current === "map" ? null : "map"));
      if (key === " " && workGame) {
        hitWorkGame();
      } else if (key === " ") {
        engineRef.current.paused = !engineRef.current.paused;
        refresh();
      }
      if (key === "escape") setPanel(null);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase());
    };
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === canvasRef.current) {
        engineRef.current.player.angle = normalizeAngle(
          engineRef.current.player.angle + event.movementX * 0.0022,
        );
        engineRef.current.player.pitch = clamp(
          engineRef.current.player.pitch - event.movementY * 0.0017,
          -0.58,
          0.58,
        );
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [interact, refresh, workGame]);

  const completeJob = useCallback(() => {
    const engine = engineRef.current;
    if (!engine.activeJob) return;
    const job = JOBS.find((item) => item.id === engine.activeJob?.jobId);
    if (!job) return;
    const rewardHook = HOOK_MODULES.find((hook) => hook.id === "shift-rewards")!;
    const bonus = hookActive(engine, "shift-rewards") ? Math.round(job.pay * 0.15) : 0;
    engine.cash += job.pay + bonus;
    engine.reputation += job.reputation;
    engine.energy = clamp(engine.energy - 13, 0, 100);
    engine.jobsCompleted += 1;
    engine.businesses[job.buildingId].cash -= job.pay;
    engine.businesses[job.buildingId].output = clamp(
      engine.businesses[job.buildingId].output + 6,
      0,
      100,
    );
    addEvent(
      engine,
      `${job.title} complete. ${formatMoney(job.pay + bonus)} settled.`,
    );
    if (bonus) addPacket(engine, rewardHook, `SHIFT BONUS ${formatMoney(bonus)}`);
    engine.activeJob = null;
    soundRef.current?.blip("reward");
    refresh();
  }, [refresh]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let threeEngine: RhoosThreeEngine | null = null;
    let previous = performance.now();

    const frame = (now: number) => {
      if (!threeEngine || cancelled) return;
      const engine = engineRef.current;
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      engine.elapsed += delta;

      if (!engine.paused && !introOpen) {
        const keys = keysRef.current;
        const turn =
          (keys.has("arrowright") || keys.has("q") ? 1 : 0) -
          (keys.has("arrowleft") ? 1 : 0);
        engine.player.angle = normalizeAngle(engine.player.angle + turn * delta * 1.7);

        const forward =
          (keys.has("w") || keys.has("arrowup") ? 1 : 0) -
          (keys.has("s") || keys.has("arrowdown") ? 1 : 0);
        const strafe = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
        engine.sprinting = keys.has("shift") && engine.energy > 3;
        engine.moving = Boolean(forward || strafe);
        if (engine.moving) {
          const magnitude = Math.hypot(forward, strafe);
          const speed = (engine.sprinting ? 195 : 118) * delta;
          const forwardX = Math.cos(engine.player.angle);
          const forwardY = Math.sin(engine.player.angle);
          const rightX = -forwardY;
          const rightY = forwardX;
          const nextX = clamp(
            engine.player.x +
              ((forward / magnitude) * forwardX + (strafe / magnitude) * rightX) * speed,
            12,
            MAP_WIDTH - 12,
          );
          const nextY = clamp(
            engine.player.y +
              ((forward / magnitude) * forwardY + (strafe / magnitude) * rightY) * speed,
            12,
            MAP_HEIGHT - 12,
          );
          if (!collidesWithBuilding(nextX, engine.player.y)) engine.player.x = nextX;
          if (!collidesWithBuilding(engine.player.x, nextY)) engine.player.y = nextY;
          if (engine.sprinting) engine.energy = clamp(engine.energy - delta * 1.4, 0, 100);
        } else {
          engine.energy = clamp(engine.energy + delta * 0.5, 0, 100);
        }

        engine.simMinutes += delta * 3 * engine.speed;
        if (engine.simMinutes >= 1440) {
          engine.simMinutes -= 1440;
          engine.day += 1;
          engine.energy = clamp(engine.energy + 34, 0, 100);
          engine.weather =
            engine.day % 3 === 0 ? "RAIN" : engine.day % 2 === 0 ? "CLEAR" : "MIST";
          addEvent(engine, `Day ${String(engine.day).padStart(2, "0")} began.`);
        }

        if (engine.activeJob?.working) {
          engine.activeJob.progress += delta * engine.speed;
          const job = JOBS.find((item) => item.id === engine.activeJob?.jobId);
          if (job && engine.activeJob.progress >= job.duration) completeJob();
        }

        engine.economyAccumulator += delta * engine.speed;
        if (engine.economyAccumulator >= 4.5) {
          engine.economyAccumulator = 0;
          runEconomy(engine);
        }
      }

      threeEngine.update(engine, delta);
      engine.uiAccumulator += delta;
      if (engine.uiAccumulator > 0.2) {
        engine.uiAccumulator = 0;
        refresh();
      }
      frameRef.current = requestAnimationFrame(frame);
    };

    void import("./rhoos-three-engine").then(({ createRhoosThreeEngine }) => {
      if (cancelled) return;
      threeEngine = createRhoosThreeEngine(canvas);
      threeRef.current = threeEngine;
      previous = performance.now();
      frameRef.current = requestAnimationFrame(frame);
    });

    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      threeEngine?.dispose();
      if (threeRef.current === threeEngine) threeRef.current = null;
    };
  }, [completeJob, introOpen, refresh]);

  const engine = engineRef.current;
  void revision;
  const time = clockParts(engine);
  const focused = getFocusedBuilding(engine);
  const selected =
    BUILDINGS.find((building) => building.id === engine.selectedId) ?? BUILDINGS[0];
  const business = engine.businesses[selected.id];
  const activeJob = engine.activeJob
    ? JOBS.find((job) => job.id === engine.activeJob?.jobId)
    : null;
  const installedCount = engine.installedHooks.length;
  const activeHookCount = engine.installedHooks.filter(
    (id) => !engine.disabledHooks.includes(id),
  ).length;
  const nearSelected = distanceToRect(engine.player.x, engine.player.y, selected) < 105;

  function acceptJob(job: Job) {
    if (engine.reputation < job.requiredReputation || engine.activeJob) {
      soundRef.current?.blip("error");
      return;
    }
    engine.activeJob = { jobId: job.id, progress: 0, working: false };
    engine.selectedId = job.buildingId;
    const target = BUILDINGS.find((building) => building.id === job.buildingId)!;
    addEvent(engine, `${job.title} accepted. Travel to ${target.name}.`);
    soundRef.current?.blip("interact");
    setPanel(null);
    refresh();
  }

  function purchaseProperty() {
    if (selected.price <= 0 || engine.properties.includes(selected.id)) return;
    if (engine.cash < selected.price) {
      addEvent(engine, `${formatMoney(selected.price - engine.cash)} more required.`);
      soundRef.current?.blip("error");
      refresh();
      return;
    }
    engine.cash -= selected.price;
    engine.properties.push(selected.id);
    addEvent(engine, `${selected.name} ownership transferred.`);
    soundRef.current?.blip("reward");
    refresh();
  }

  function upgradeProperty() {
    const cost = business.level * 600;
    if (!engine.properties.includes(selected.id) || engine.cash < cost) return;
    engine.cash -= cost;
    business.level += 1;
    business.output = clamp(business.output + 11, 0, 100);
    business.demand = clamp(business.demand + 5, 0, 100);
    addEvent(engine, `${selected.name} upgraded to LV.${business.level}.`);
    soundRef.current?.blip("reward");
    refresh();
  }

  function manageHook(hook: HookModule) {
    const installed = engine.installedHooks.includes(hook.id);
    if (!installed) {
      if (engine.cash < hook.cost) {
        addEvent(engine, `${formatMoney(hook.cost - engine.cash)} more required for ${hook.name}.`);
        soundRef.current?.blip("error");
        refresh();
        return;
      }
      engine.cash -= hook.cost;
      engine.installedHooks.push(hook.id);
      engine.disabledHooks = engine.disabledHooks.filter((id) => id !== hook.id);
      addPacket(engine, hook, "MODULE INSTALLED");
      addEvent(engine, `${hook.name} bound to the city.`);
      soundRef.current?.blip("hook");
    } else if (engine.disabledHooks.includes(hook.id)) {
      engine.disabledHooks = engine.disabledHooks.filter((id) => id !== hook.id);
      addPacket(engine, hook, "MODULE RESUMED");
      soundRef.current?.blip("hook");
    } else {
      engine.disabledHooks.push(hook.id);
      addEvent(engine, `${hook.name} paused.`);
    }
    refresh();
  }

  function pressControl(key: string, active: boolean) {
    if (active) keysRef.current.add(key);
    else keysRef.current.delete(key);
  }

  function canvasClick() {
    canvasRef.current?.focus();
    canvasRef.current?.requestPointerLock?.();
  }

  function toggleAudio() {
    const next = !audioOn;
    setAudioOn(next);
    if (next) {
      void soundRef.current?.start();
      soundRef.current?.setMuted(false);
      soundRef.current?.blip("interact");
    } else {
      soundRef.current?.setMuted(true);
    }
  }

  async function enterCity() {
    if (audioOn) {
      await soundRef.current?.start();
      soundRef.current?.setMuted(false);
    }
    setIntroOpen(false);
    canvasRef.current?.focus();
  }

  function hitWorkGame() {
    if (!workGame) return;
    const accuracy = Math.abs(workGame.needle - workGame.target);
    const points = accuracy <= 7 ? 2 : accuracy <= 17 ? 1 : 0;
    const score = workGame.score + points;
    const attempts = workGame.attempts + 1;
    if (points) soundRef.current?.blip(points === 2 ? "reward" : "interact");
    else soundRef.current?.blip("error");

    if (score >= 6) {
      const active = engineRef.current.activeJob;
      const job = JOBS.find((item) => item.id === active?.jobId);
      if (active && job) {
        active.working = true;
        active.progress = job.duration;
        addEvent(
          engineRef.current,
          `${job.title} performance verified ${score}/6.`,
        );
      }
      setWorkGame(null);
      refresh();
      return;
    }
    if (attempts >= 8) {
      addEvent(
        engineRef.current,
        `Shift verification failed ${score}/6. Retry at the terminal.`,
      );
      setWorkGame(null);
      refresh();
      return;
    }
    setWorkGame({
      ...workGame,
      score,
      attempts,
      target: 18 + ((attempts * 37 + workGame.jobId.length * 11) % 65),
    });
  }

  const jobProgress =
    activeJob && engine.activeJob
      ? clamp((engine.activeJob.progress / activeJob.duration) * 100, 0, 100)
      : 0;

  const mapBuildings = useMemo(() => BUILDINGS, []);

  return (
    <main className="live-shell">
      <section className="live-stage">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onClick={canvasClick}
          tabIndex={0}
          aria-label="First-person view of Rhoos City. Use WASD to move, arrow keys or the mouse to look, and E to interact."
        />
        <div className="crt-layer" aria-hidden="true" />

        <header className="live-topbar">
          <div className="live-brand">
            <div className="live-logo">R</div>
            <div>
              <span>RHOOS PROTOCOL / DISTRICT 01</span>
              <strong>RHOOS CITY</strong>
            </div>
          </div>
          <div className="live-clock">
            <span>DAY {String(engine.day).padStart(2, "0")}</span>
            <strong>{time.text}</strong>
            <small>{engine.weather} / {engine.paused ? "PAUSED" : `${engine.speed}× LIVE`}</small>
          </div>
          <div className="live-wallet">
            <span>PLAYER WALLET</span>
            <strong>{formatMoney(engine.cash)}</strong>
            <small>REP {String(engine.reputation).padStart(2, "0")} / ENERGY {Math.round(engine.energy)}%</small>
          </div>
          <div className="top-actions">
            <button onClick={toggleAudio}>{audioOn ? "MUSIC ON" : "MUSIC OFF"}</button>
            <label className="volume-control">
              <span>VOL</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Music volume"
              />
            </label>
            <button
              onClick={() => {
                engine.paused = !engine.paused;
                refresh();
              }}
            >
              {engine.paused ? "RESUME" : "PAUSE"}
            </button>
          </div>
        </header>

        <aside className="live-objective">
          <span className="panel-label">CURRENT DIRECTIVE</span>
          <strong>
            {activeJob
              ? engine.activeJob?.working
                ? `WORKING: ${activeJob.title}`
                : `REPORT TO ${BUILDINGS.find((building) => building.id === activeJob.buildingId)?.shortName}`
              : engine.properties.length
                ? "EXPAND YOUR CITY NETWORK"
                : "FIND WORK. EARN. OWN."}
          </strong>
          <p>
            {activeJob
              ? engine.activeJob?.working
                ? "Stay connected while the shift verifies."
                : "Follow the city map, face the building, press E."
              : "Enter a business terminal or open the city jobs channel."}
          </p>
          {activeJob && (
            <div className="objective-progress">
              <i style={{ width: `${jobProgress}%` }} />
            </div>
          )}
        </aside>

        <aside className="hook-monitor">
          <div className="hook-monitor-head">
            <div>
              <span>HOOKTECH NETWORK</span>
              <strong>{activeHookCount}/{installedCount} ACTIVE</strong>
            </div>
            <i />
          </div>
          <div className="packet-list">
            {engine.hookPackets.slice(0, 4).map((packet) => (
              <div key={`${packet.block}-${packet.hook}`}>
                <span style={{ color: packet.color }}>{packet.hook}</span>
                <p>{packet.message}</p>
                <small>#{packet.block}</small>
              </div>
            ))}
          </div>
          <button onClick={() => setPanel("hooks")}>OPEN HOOK MATRIX [H]</button>
        </aside>

        <div className="city-telemetry">
          <Telemetry label="CITY OUTPUT" value={formatMoney(engine.cityGDP)} color="#67d7e5" />
          <Telemetry label="EMPLOYMENT" value={`${engine.employment}%`} color="#65d6a6" />
          <Telemetry label="GRID LOAD" value={`${Math.round(engine.powerLoad)}%`} color="#f4d35e" />
          <Telemetry label="TRAFFIC" value={`${Math.round(engine.traffic)}%`} color="#ff5d9e" />
        </div>

        <nav className="live-nav" aria-label="Game panels">
          <button className={panel === "map" ? "active" : ""} onClick={() => setPanel(panel === "map" ? null : "map")}>
            <b>M</b><span>MAP</span>
          </button>
          <button className={panel === "jobs" ? "active" : ""} onClick={() => setPanel(panel === "jobs" ? null : "jobs")}>
            <b>J</b><span>JOBS</span>
          </button>
          <button className={panel === "hooks" ? "active" : ""} onClick={() => setPanel(panel === "hooks" ? null : "hooks")}>
            <b>H</b><span>HOOKTECH</span>
          </button>
          <button onClick={saveGame}>
            <b>⌁</b><span>{saveLabel}</span>
          </button>
        </nav>

        <div className="live-controls">
          <span>WASD MOVE</span>
          <span>MOUSE / ← → LOOK</span>
          <span>SHIFT SPRINT</span>
          <span>E INTERACT</span>
          <span>ESC RELEASE</span>
        </div>

        <div className="mobile-drive" aria-label="Mobile movement controls">
          <button
            onPointerDown={() => pressControl("arrowleft", true)}
            onPointerUp={() => pressControl("arrowleft", false)}
            onPointerLeave={() => pressControl("arrowleft", false)}
          >
            ↶
          </button>
          <button
            onPointerDown={() => pressControl("w", true)}
            onPointerUp={() => pressControl("w", false)}
            onPointerLeave={() => pressControl("w", false)}
          >
            ▲
          </button>
          <button
            onPointerDown={() => pressControl("arrowright", true)}
            onPointerUp={() => pressControl("arrowright", false)}
            onPointerLeave={() => pressControl("arrowright", false)}
          >
            ↷
          </button>
          <button
            onPointerDown={() => pressControl("a", true)}
            onPointerUp={() => pressControl("a", false)}
            onPointerLeave={() => pressControl("a", false)}
          >
            ◀
          </button>
          <button className="interact" onClick={interact}>E</button>
          <button
            onPointerDown={() => pressControl("d", true)}
            onPointerUp={() => pressControl("d", false)}
            onPointerLeave={() => pressControl("d", false)}
          >
            ▶
          </button>
          <button
            onPointerDown={() => pressControl("s", true)}
            onPointerUp={() => pressControl("s", false)}
            onPointerLeave={() => pressControl("s", false)}
          >
            ▼
          </button>
        </div>

        {focused && !panel && (
          <div className="target-card" style={{ "--target-accent": focused.building.accent } as React.CSSProperties}>
            <span>{focused.building.kind.toUpperCase()} / {Math.round(focused.distance)}m</span>
            <strong>{focused.building.name}</strong>
            <p>{focused.building.description}</p>
          </div>
        )}

        {panel && (
          <div className="live-panel-backdrop" onMouseDown={() => setPanel(null)}>
            <section
              className={`live-panel ${panel === "map" ? "map-panel" : ""}`}
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`${panel} panel`}
            >
              <div className="live-panel-header">
                <div>
                  <span>RHOOS CITY SYSTEM</span>
                  <strong>
                    {panel === "building"
                      ? selected.name
                      : panel === "jobs"
                        ? "CITY JOBS CHANNEL"
                        : panel === "hooks"
                          ? "HOOKTECH MATRIX"
                          : "DISTRICT ONE MAP"}
                  </strong>
                </div>
                <button onClick={() => setPanel(null)}>CLOSE ×</button>
              </div>

              {panel === "building" && (
                <div className="building-terminal">
                  <div className="terminal-identity" style={{ "--terminal-accent": selected.accent } as React.CSSProperties}>
                    <div>{selected.shortName.slice(0, 2)}</div>
                    <span>{selected.kind.toUpperCase()}</span>
                    <h2>{selected.name}</h2>
                    <p>{selected.description}</p>
                    <small>{isOpen(selected, time.hour) ? "● OPEN NOW" : "○ CLOSED"} / {nearSelected ? "LOCAL LINK" : "REMOTE VIEW"}</small>
                  </div>
                  <div className="terminal-data">
                    <div className="terminal-stats">
                      <DataStat label="INVENTORY" value={`${Math.round(business.inventory)} U`} />
                      <DataStat label="WORKERS" value={String(business.workers)} />
                      <DataStat label="DEMAND" value={`${Math.round(business.demand)}%`} />
                      <DataStat label="TREASURY" value={formatMoney(business.cash)} />
                      <DataStat label="OUTPUT" value={`${Math.round(business.output)}%`} />
                      <DataStat label="LEVEL" value={`LV.${business.level}`} />
                    </div>
                    <div className="terminal-actions">
                      <button onClick={() => setPanel("jobs")}>VIEW LOCAL JOBS</button>
                      {selected.price > 0 && !engine.properties.includes(selected.id) && (
                        <button
                          className="primary-action"
                          onClick={purchaseProperty}
                          disabled={engine.cash < selected.price}
                        >
                          ACQUIRE PROPERTY / {formatMoney(selected.price)}
                        </button>
                      )}
                      {engine.properties.includes(selected.id) && (
                        <button
                          className="primary-action"
                          onClick={upgradeProperty}
                          disabled={engine.cash < business.level * 600}
                        >
                          UPGRADE BUSINESS / {formatMoney(business.level * 600)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {panel === "jobs" && (
                <div className="jobs-channel">
                  <div className="channel-summary">
                    <div><span>OPEN CONTRACTS</span><strong>{JOBS.length}</strong></div>
                    <div><span>PLAYER REP</span><strong>{engine.reputation}</strong></div>
                    <div><span>SHIFTS COMPLETE</span><strong>{engine.jobsCompleted}</strong></div>
                  </div>
                  <div className="job-grid">
                    {JOBS.map((job) => {
                      const building = BUILDINGS.find((item) => item.id === job.buildingId)!;
                      const locked = engine.reputation < job.requiredReputation;
                      const active = engine.activeJob?.jobId === job.id;
                      return (
                        <article key={job.id} className={active ? "active" : ""}>
                          <div className="job-building" style={{ color: building.accent }}>
                            {building.shortName} / REP {job.requiredReputation}+
                          </div>
                          <h3>{job.title}</h3>
                          <p>{job.description}</p>
                          <div className="job-meta">
                            <strong>{formatMoney(job.pay)}</strong>
                            <span>{job.duration}s VERIFIED SHIFT</span>
                          </div>
                          <button
                            onClick={() => acceptJob(job)}
                            disabled={locked || Boolean(engine.activeJob)}
                          >
                            {active ? "CONTRACT ACTIVE" : locked ? "REPUTATION LOCKED" : "ACCEPT CONTRACT"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {panel === "hooks" && (
                <div className="hooks-matrix">
                  <div className="matrix-explainer">
                    <div>
                      <span>HOOKTECH / PROGRAMMABLE CITY OPERATIONS</span>
                      <h2>Events enter. Conditions resolve. Value moves.</h2>
                      <p>
                        Install modules once, then watch them react to jobs, sales,
                        inventory, traffic, revenue, and grid load in real time.
                      </p>
                    </div>
                    <div className="matrix-signal">
                      <i />
                      <span>{activeHookCount} ACTIVE HOOKS</span>
                      <strong>BLOCK {engine.block}</strong>
                    </div>
                  </div>
                  <div className="hook-grid">
                    {HOOK_MODULES.map((hook) => {
                      const installed = engine.installedHooks.includes(hook.id);
                      const active = installed && !engine.disabledHooks.includes(hook.id);
                      const building = BUILDINGS.find((item) => item.id === hook.buildingId)!;
                      return (
                        <article
                          key={hook.id}
                          className={active ? "active" : installed ? "paused" : ""}
                          style={{ "--hook-color": hook.color } as React.CSSProperties}
                        >
                          <div className="hook-code">
                            <span>{hook.code}</span>
                            <i>{active ? "ACTIVE" : installed ? "PAUSED" : "AVAILABLE"}</i>
                          </div>
                          <h3>{hook.name}</h3>
                          <p>{hook.description}</p>
                          <div className="hook-flow">
                            <div><span>TRIGGER</span><strong>{hook.trigger}</strong></div>
                            <b>→</b>
                            <div><span>ACTION</span><strong>{hook.action}</strong></div>
                          </div>
                          <small>BOUND TO {building.shortName}</small>
                          <button
                            onClick={() => manageHook(hook)}
                            disabled={!installed && engine.cash < hook.cost}
                          >
                            {!installed
                              ? `INSTALL / ${formatMoney(hook.cost)}`
                              : active
                                ? "PAUSE MODULE"
                                : "RESUME MODULE"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {panel === "map" && (
                <div className="district-map">
                  <div className="map-canvas">
                    {ROAD_X.map((x) => (
                      <i
                        className="map-road vertical"
                        key={`x-${x}`}
                        style={{ left: `${(x / MAP_WIDTH) * 100}%`, width: `${(ROAD_WIDTH / MAP_WIDTH) * 100}%` }}
                      />
                    ))}
                    {ROAD_Y.map((y) => (
                      <i
                        className="map-road horizontal"
                        key={`y-${y}`}
                        style={{ top: `${(y / MAP_HEIGHT) * 100}%`, height: `${(ROAD_WIDTH / MAP_HEIGHT) * 100}%` }}
                      />
                    ))}
                    {mapBuildings.map((building) => (
                      <button
                        key={building.id}
                        className={selected.id === building.id ? "selected" : ""}
                        style={{
                          left: `${(building.x / MAP_WIDTH) * 100}%`,
                          top: `${(building.y / MAP_HEIGHT) * 100}%`,
                          width: `${(building.w / MAP_WIDTH) * 100}%`,
                          height: `${(building.h / MAP_HEIGHT) * 100}%`,
                          borderColor: building.accent,
                        }}
                        onClick={() => {
                          engine.selectedId = building.id;
                          refresh();
                        }}
                      >
                        {building.shortName}
                      </button>
                    ))}
                    <div
                      className="map-player"
                      style={{
                        left: `${(engine.player.x / MAP_WIDTH) * 100}%`,
                        top: `${(engine.player.y / MAP_HEIGHT) * 100}%`,
                        transform: `translate(-50%, -50%) rotate(${engine.player.angle}rad)`,
                      }}
                    />
                  </div>
                  <aside className="map-sidebar">
                    <span>SELECTED LOCATION</span>
                    <h2>{selected.name}</h2>
                    <p>{selected.description}</p>
                    <div>
                      <DataStat label="DISTANCE" value={`${Math.round(distanceToRect(engine.player.x, engine.player.y, selected))}m`} />
                      <DataStat label="PROPERTY" value={selected.price ? formatMoney(selected.price) : "PUBLIC"} />
                    </div>
                    <button onClick={() => setPanel("building")}>OPEN BUILDING FILE</button>
                  </aside>
                </div>
              )}
            </section>
          </div>
        )}

        {workGame && (
          <div className="work-console-backdrop">
            <section className="work-console" role="dialog" aria-modal="true" aria-labelledby="work-title">
              <div className="work-console-header">
                <div>
                  <span>LIVE SHIFT / SKILL VERIFICATION</span>
                  <strong id="work-title">
                    {JOBS.find((job) => job.id === workGame.jobId)?.title}
                  </strong>
                </div>
                <b>{workGame.timeLeft.toFixed(1)}s</b>
              </div>
              <div className="work-machine">
                <div className="machine-readout">
                  <span>PERFORMANCE</span>
                  <strong>{workGame.score}/6</strong>
                  <small>ATTEMPT {workGame.attempts + 1}/8</small>
                </div>
                <div className="timing-track">
                  <i
                    className="target-zone"
                    style={{ left: `${workGame.target - 8}%` }}
                  />
                  <b style={{ left: `${workGame.needle}%` }} />
                </div>
                <p>
                  Lock the signal while the white needle crosses the green work zone.
                  Precise timing earns two performance points.
                </p>
                <button onClick={hitWorkGame}>LOCK ACTION <span>SPACE</span></button>
              </div>
              <div className="work-console-footer">
                <span>HOOKTECH VERIFIES THE ACTION, THE BUSINESS PAYS THE WAGE.</span>
                <button
                  onClick={() => {
                    setWorkGame(null);
                    addEvent(engineRef.current, "Shift console closed. Contract remains active.");
                  }}
                >
                  EXIT SHIFT
                </button>
              </div>
            </section>
          </div>
        )}

        {introOpen && (
          <div className="live-intro">
            <div className="intro-city-lines" aria-hidden="true" />
            <div className="intro-protocol">
              <span>HOOKTECH OPERATING SYSTEM / BOOT SEQUENCE 88</span>
              <strong>RHOOS</strong>
              <strong>CITY</strong>
              <p>REAL 3D ECONOMIC PROTOCOL</p>
            </div>
            <div className="intro-brief">
              <span className="panel-label">DISTRICT ONE / 06:52</span>
              <h1>Real streets. Real models.<br />A city you can play.</h1>
              <p>
                Walk a fully modeled 3D district, follow traffic and citizens,
                play skill-based shifts, buy businesses, and hear the city&apos;s
                original midnight circuit soundtrack.
              </p>
              <div className="intro-keys">
                <div><kbd>WASD</kbd><span>MOVE</span></div>
                <div><kbd>MOUSE</kbd><span>LOOK</span></div>
                <div><kbd>E</kbd><span>INTERACT</span></div>
                <div><kbd>H</kbd><span>HOOKTECH</span></div>
              </div>
              <button onClick={() => void enterCity()}>
                ENTER 3D CITY + MUSIC <b>→</b>
              </button>
              <small>WEBGL MODEL RUNTIME / ORIGINAL AUDIO / VERSION 0.3</small>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Telemetry({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{ "--telemetry-color": color } as React.CSSProperties}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DataStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
