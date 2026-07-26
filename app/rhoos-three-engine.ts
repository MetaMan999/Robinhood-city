"use client";

import * as THREE from "three";
import {
  BUILDINGS,
  CAR_COLORS,
  HOOK_MODULES,
  MAP_HEIGHT,
  MAP_WIDTH,
  NPC_NAMES,
  ROAD_WIDTH,
  ROAD_X,
  ROAD_Y,
  type Building,
} from "./game-data";

export type Rhoos3DState = {
  player: { x: number; y: number; angle: number; pitch: number };
  vehicle: {
    x: number;
    y: number;
    angle: number;
    speed: number;
    steering: number;
    inCar: boolean;
  };
  profile: { skin: string; jacket: string; accent: string };
  simMinutes: number;
  elapsed: number;
  moving: boolean;
  sprinting: boolean;
  weather: "CLEAR" | "MIST" | "RAIN";
  traffic: number;
  installedHooks: string[];
  disabledHooks: string[];
};

type AnimatedCar = {
  group: THREE.Group;
  index: number;
  wheels: THREE.Mesh[];
};

type AnimatedNpc = {
  group: THREE.Group;
  index: number;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
};

type TrafficSignal = {
  horizontal: THREE.MeshStandardMaterial;
  vertical: THREE.MeshStandardMaterial;
};

const color = {
  road: 0x202932,
  sidewalk: 0x596064,
  ground: 0x1c322d,
  cyan: 0x67d7e5,
  pink: 0xff5d9e,
  gold: 0xf4d35e,
  green: 0x65d6a6,
  ink: 0x090d16,
};

function buildingHeight(building: Building) {
  const base: Record<Building["kind"], number> = {
    utility: 92,
    industry: 72,
    commerce: 86,
    finance: 130,
    civic: 112,
    residential: 144,
    transport: 68,
    entertainment: 98,
  };
  return base[building.kind] + (building.id.length % 3) * 9;
}

function makeCanvasTexture(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas texture context unavailable");
  draw(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeSignSprite(building: Building) {
  const texture = makeCanvasTexture(512, 128, (context) => {
    context.fillStyle = "rgba(7, 10, 17, .92)";
    context.fillRect(0, 0, 512, 128);
    context.strokeStyle = building.accent;
    context.lineWidth = 8;
    context.strokeRect(6, 6, 500, 116);
    context.shadowColor = building.accent;
    context.shadowBlur = 18;
    context.fillStyle = building.accent;
    context.font = `700 ${building.shortName.length > 10 ? 48 : 58}px "Courier New"`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(building.shortName, 256, 67, 470);
  });
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(Math.min(building.w * 0.62, 130), 28, 1);
  return sprite;
}

function makeBuilding(building: Building, windowTransforms: THREE.Matrix4[]) {
  const group = new THREE.Group();
  group.userData.buildingId = building.id;
  const height = buildingHeight(building);
  const material = new THREE.MeshStandardMaterial({
    color: building.color,
    emissive: building.color,
    emissiveIntensity: 0.16,
    roughness: 0.78,
    metalness: building.kind === "industry" ? 0.28 : 0.12,
  });
  const structure = new THREE.Mesh(
    new THREE.BoxGeometry(building.w, height, building.h),
    material,
  );
  structure.position.y = height / 2;
  structure.castShadow = true;
  structure.receiveShadow = true;
  group.add(structure);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(building.w * 0.92, 5, building.h * 0.92),
    new THREE.MeshStandardMaterial({
      color: building.accent,
      roughness: 0.5,
      metalness: 0.35,
      emissive: building.accent,
      emissiveIntensity: 0.08,
    }),
  );
  roof.position.y = height + 2.5;
  roof.castShadow = true;
  group.add(roof);

  if (["industry", "utility", "transport"].includes(building.kind)) {
    const stackMaterial = new THREE.MeshStandardMaterial({
      color: 0x313943,
      roughness: 0.7,
      metalness: 0.42,
    });
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 9, 34, 10),
      stackMaterial,
    );
    stack.position.set(building.w * 0.25, height + 18, building.h * 0.18);
    stack.castShadow = true;
    group.add(stack);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 3, 10),
      new THREE.MeshStandardMaterial({ color: building.accent, emissive: building.accent, emissiveIntensity: 0.2 }),
    );
    cap.position.copy(stack.position);
    cap.position.y += 18;
    group.add(cap);
  } else {
    const rooftop = new THREE.Mesh(
      new THREE.BoxGeometry(
        Math.min(44, building.w * 0.3),
        13,
        Math.min(36, building.h * 0.3),
      ),
      new THREE.MeshStandardMaterial({ color: 0x313946, roughness: 0.7 }),
    );
    rooftop.position.set(
      -building.w * 0.18,
      height + 8,
      building.h * 0.12,
    );
    rooftop.castShadow = true;
    group.add(rooftop);
  }

  const antenna = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.2, 30, 6),
    new THREE.MeshStandardMaterial({
      color: 0xa8b1ba,
      metalness: 0.8,
      roughness: 0.25,
    }),
  );
  antenna.position.set(building.w * 0.25, height + 17, -building.h * 0.22);
  group.add(antenna);

  const sign = makeSignSprite(building);
  sign.position.set(0, Math.min(height * 0.7, height - 18), building.h / 2 + 2);
  group.add(sign);

  const rows = Math.max(2, Math.floor((height - 34) / 22));
  const colsFront = Math.max(3, Math.floor((building.w - 24) / 34));
  const colsSide = Math.max(2, Math.floor((building.h - 24) / 34));
  const centerX = building.x + building.w / 2;
  const centerZ = building.y + building.h / 2;
  const dummy = new THREE.Object3D();
  for (let row = 0; row < rows; row++) {
    const y = 18 + row * ((height - 36) / rows);
    for (let column = 0; column < colsFront; column++) {
      const x =
        -building.w / 2 +
        18 +
        column * ((building.w - 36) / Math.max(1, colsFront - 1));
      for (const side of [-1, 1]) {
        dummy.position.set(
          centerX + x,
          y,
          centerZ + side * (building.h / 2 + 0.4),
        );
        dummy.rotation.set(0, side < 0 ? Math.PI : 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        windowTransforms.push(dummy.matrix.clone());
      }
    }
    for (let column = 0; column < colsSide; column++) {
      const z =
        -building.h / 2 +
        18 +
        column * ((building.h - 36) / Math.max(1, colsSide - 1));
      for (const side of [-1, 1]) {
        dummy.position.set(
          centerX + side * (building.w / 2 + 0.4),
          y,
          centerZ + z,
        );
        dummy.rotation.set(0, side < 0 ? -Math.PI / 2 : Math.PI / 2, 0);
        dummy.updateMatrix();
        windowTransforms.push(dummy.matrix.clone());
      }
    }
  }

  group.position.set(
    building.x + building.w / 2,
    0,
    building.y + building.h / 2,
  );
  return group;
}

function addWindowInstances(scene: THREE.Scene, transforms: THREE.Matrix4[]) {
  const lit = new THREE.InstancedMesh(
    new THREE.BoxGeometry(10, 6, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0xf3d478,
      emissive: 0xf3d478,
      emissiveIntensity: 1.2,
      roughness: 0.38,
    }),
    transforms.length,
  );
  const dark = new THREE.InstancedMesh(
    new THREE.BoxGeometry(10, 6, 0.6),
    new THREE.MeshStandardMaterial({
      color: 0x294655,
      emissive: 0x132832,
      emissiveIntensity: 0.35,
      roughness: 0.5,
    }),
    transforms.length,
  );
  transforms.forEach((matrix, index) => {
    if (index % 4 === 0) dark.setMatrixAt(index, matrix);
    else lit.setMatrixAt(index, matrix);
  });
  lit.instanceMatrix.needsUpdate = true;
  dark.instanceMatrix.needsUpdate = true;
  scene.add(lit, dark);
  return { lit, dark };
}

function makeCar(index: number): AnimatedCar {
  const group = new THREE.Group();
  const carColor = new THREE.Color(CAR_COLORS[index % CAR_COLORS.length]);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: carColor,
    roughness: 0.42,
    metalness: 0.46,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 11), bodyMaterial);
  body.position.y = 6;
  body.castShadow = true;
  group.add(body);
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(11, 6, 9),
    new THREE.MeshStandardMaterial({
      color: 0x8ab4c0,
      roughness: 0.18,
      metalness: 0.35,
      transparent: true,
      opacity: 0.82,
    }),
  );
  cabin.position.set(-1, 12, 0);
  cabin.castShadow = true;
  group.add(cabin);
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(8.5, 2.2, 9.8),
    new THREE.MeshStandardMaterial({
      color: carColor,
      roughness: 0.35,
      metalness: 0.55,
    }),
  );
  hood.position.set(7.4, 9.2, 0);
  hood.castShadow = true;
  group.add(hood);
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 5.2, 8.2),
    new THREE.MeshStandardMaterial({
      color: 0x9fd6e4,
      emissive: 0x142f3b,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.55,
      transparent: true,
      opacity: 0.76,
    }),
  );
  windshield.position.set(4.4, 12.1, 0);
  windshield.rotation.z = -0.28;
  group.add(windshield);
  const bumper = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 10),
    new THREE.MeshStandardMaterial({ color: 0xb8bec3, metalness: 0.8 }),
  );
  bumper.position.set(12.5, 4, 0);
  group.add(bumper);
  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 2.5, 6.4),
    new THREE.MeshStandardMaterial({
      color: 0x11151a,
      metalness: 0.85,
      roughness: 0.24,
    }),
  );
  grille.position.set(12.85, 5.6, 0);
  group.add(grille);
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xfff1b5,
    emissive: 0xffe38b,
    emissiveIntensity: 2.2,
  });
  for (const z of [-3.7, 3.7]) {
    const light = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 2.2, 2.2),
      headlightMaterial,
    );
    light.position.set(12.2, 6.2, z);
    group.add(light);
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 2, 2.6),
      new THREE.MeshStandardMaterial({
        color: 0xff425c,
        emissive: 0xff163f,
        emissiveIntensity: 1.8,
      }),
    );
    tail.position.set(-12.2, 6.1, z);
    group.add(tail);
  }
  const wheels: THREE.Mesh[] = [];
  const wheelGeometry = new THREE.CylinderGeometry(2.3, 2.3, 1.7, 12);
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x090a0d,
    roughness: 0.9,
  });
  for (const x of [-7.5, 7.5]) {
    for (const z of [-5.6, 5.6]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 3.2, z);
      wheel.castShadow = true;
      group.add(wheel);
      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(1.25, 1.25, 1.82, 10),
        new THREE.MeshStandardMaterial({
          color: 0xbec7ce,
          metalness: 0.9,
          roughness: 0.22,
        }),
      );
      rim.rotation.x = Math.PI / 2;
      rim.position.copy(wheel.position);
      group.add(rim);
      wheels.push(wheel);
    }
  }
  return { group, index, wheels };
}

function makeNpc(index: number): AnimatedNpc {
  const group = new THREE.Group();
  const cloth = new THREE.MeshStandardMaterial({
    color:
      index % 4 === 0
        ? 0xff6eae
        : index % 4 === 1
          ? 0x5fcbd9
          : index % 4 === 2
            ? 0xe3bd4f
            : 0x6bb594,
    roughness: 0.72,
  });
  const skin = new THREE.MeshStandardMaterial({
    color: 0xd9a47c,
    roughness: 0.78,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x202330, roughness: 0.8 });
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(3.8, 8, 5, 8), cloth);
  torso.position.y = 14;
  torso.castShadow = true;
  group.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 10), skin);
  head.position.y = 24;
  head.castShadow = true;
  group.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(3.65, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    dark,
  );
  hair.position.y = 25;
  hair.castShadow = true;
  group.add(hair);

  const limbGeometry = new THREE.CapsuleGeometry(1.3, 8, 4, 7);
  const leftLeg = new THREE.Mesh(limbGeometry, dark);
  const rightLeg = new THREE.Mesh(limbGeometry, dark);
  leftLeg.position.set(-2.1, 5.2, 0);
  rightLeg.position.set(2.1, 5.2, 0);
  const armGeometry = new THREE.CapsuleGeometry(1.1, 7, 4, 7);
  const leftArm = new THREE.Mesh(armGeometry, cloth);
  const rightArm = new THREE.Mesh(armGeometry, cloth);
  leftArm.position.set(-5, 14, 0);
  rightArm.position.set(5, 14, 0);
  leftArm.rotation.z = 0.12;
  rightArm.rotation.z = -0.12;
  group.add(leftLeg, rightLeg, leftArm, rightArm);
  return { group, index, leftLeg, rightLeg, leftArm, rightArm };
}

function makeStreetLight() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x343d47,
    metalness: 0.75,
    roughness: 0.35,
  });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 28, 8), metal);
  pole.position.y = 14;
  group.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 1), metal);
  arm.position.set(4.5, 27, 0);
  group.add(arm);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 8, 6),
    new THREE.MeshStandardMaterial({
      color: 0xffe49a,
      emissive: 0xffd86f,
      emissiveIntensity: 2.1,
    }),
  );
  lamp.position.set(9, 26.5, 0);
  group.add(lamp);
  return group;
}

function makeTrafficLight(): { group: THREE.Group; signal: TrafficSignal } {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0x2f3942,
    metalness: 0.65,
    roughness: 0.4,
  });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 24, 8), metal);
  pole.position.y = 12;
  group.add(pole);
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(6, 12, 5),
    new THREE.MeshStandardMaterial({ color: 0x121820, roughness: 0.65 }),
  );
  box.position.y = 24;
  group.add(box);
  const horizontal = new THREE.MeshStandardMaterial({
    color: 0x65d6a6,
    emissive: 0x65d6a6,
    emissiveIntensity: 2.2,
  });
  const vertical = new THREE.MeshStandardMaterial({
    color: 0xff5f5b,
    emissive: 0xff5f5b,
    emissiveIntensity: 2.2,
  });
  const hLamp = new THREE.Mesh(new THREE.SphereGeometry(1.45, 8, 6), horizontal);
  const vLamp = new THREE.Mesh(new THREE.SphereGeometry(1.45, 8, 6), vertical);
  hLamp.position.set(0, 26.2, 2.5);
  vLamp.position.set(0, 21.7, 2.5);
  group.add(hLamp, vLamp);
  return { group, signal: { horizontal, vertical } };
}

function npcPosition(index: number, simMinutes: number) {
  const hour = (simMinutes % 1440) / 60;
  const homes = BUILDINGS.filter((building) => building.kind === "residential");
  const work = BUILDINGS.filter(
    (building) => !["residential", "entertainment"].includes(building.kind),
  );
  const home = homes[index % homes.length];
  const workplace = work[(index * 5 + 1) % work.length];
  const leisure = BUILDINGS.find((building) =>
    index % 3 === 0
      ? building.id === "moon-arcade"
      : index % 2 === 0
        ? building.id === "harbor-market"
        : building.id === "sakura-cafe",
  )!;
  const point = (building: Building) => ({
    x: building.x + building.w / 2,
    z: building.y + building.h / 2,
  });
  let from = point(home);
  let to = point(home);
  let t = 0;
  if (hour >= 6.5 && hour < 8) {
    from = point(home);
    to = point(workplace);
    t = (hour - 6.5) / 1.5;
  } else if (hour >= 8 && hour < 17) {
    from = point(workplace);
    to = from;
  } else if (hour >= 17 && hour < 18.5) {
    from = point(workplace);
    to = point(leisure);
    t = (hour - 17) / 1.5;
  } else if (hour >= 18.5 && hour < 20.5) {
    from = point(leisure);
    to = from;
  } else if (hour >= 20.5 && hour < 22) {
    from = point(leisure);
    to = point(home);
    t = (hour - 20.5) / 1.5;
  }
  t = THREE.MathUtils.clamp(t, 0, 1);
  if (index % 2 === 0) {
    if (t < 0.5) return { x: THREE.MathUtils.lerp(from.x, to.x, t * 2), z: from.z };
    return { x: to.x, z: THREE.MathUtils.lerp(from.z, to.z, (t - 0.5) * 2) };
  }
  if (t < 0.5) return { x: from.x, z: THREE.MathUtils.lerp(from.z, to.z, t * 2) };
  return { x: THREE.MathUtils.lerp(from.x, to.x, (t - 0.5) * 2), z: to.z };
}

function carPosition(index: number, elapsed: number) {
  const horizontal = index < 16;
  const direction = index % 2 === 0 ? 1 : -1;
  if (horizontal) {
    const raw = (elapsed * (42 + (index % 4) * 8) + index * 143) % MAP_WIDTH;
    return {
      x: direction > 0 ? raw : MAP_WIDTH - raw,
      z: ROAD_Y[index % ROAD_Y.length] + (direction > 0 ? -15 : 15),
      angle: direction > 0 ? 0 : Math.PI,
    };
  }
  const raw = (elapsed * (37 + (index % 3) * 9) + index * 181) % MAP_HEIGHT;
  return {
    x: ROAD_X[index % ROAD_X.length] + (direction > 0 ? 15 : -15),
    z: direction > 0 ? raw : MAP_HEIGHT - raw,
    angle: direction > 0 ? -Math.PI / 2 : Math.PI / 2,
  };
}

export type RhoosThreeEngine = {
  update: (state: Rhoos3DState, delta: number) => void;
  dispose: () => void;
};

export function createRhoosThreeEngine(canvas: HTMLCanvasElement): RhoosThreeEngine {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1024);
  scene.fog = new THREE.FogExp2(0x101827, 0.00125);

  const camera = new THREE.PerspectiveCamera(72, 1, 0.6, 2200);
  camera.rotation.order = "YXZ";
  scene.add(camera);

  const sleeveMaterial = new THREE.MeshStandardMaterial({
    color: 0x263c58,
    roughness: 0.62,
  });
  const handMaterial = new THREE.MeshStandardMaterial({
    color: 0xdca078,
    roughness: 0.78,
  });
  const wristMaterial = new THREE.MeshStandardMaterial({
    color: 0x67d7e5,
    emissive: 0x67d7e5,
    emissiveIntensity: 0.5,
    roughness: 0.4,
  });
  const firstPersonRig = new THREE.Group();
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    const sleeve = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.075, 0.28, 4, 8),
      sleeveMaterial,
    );
    sleeve.rotation.z = side * 0.22;
    sleeve.position.y = -0.08;
    arm.add(sleeve);
    const wrist = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.055, 0.13),
      wristMaterial,
    );
    wrist.position.y = 0.12;
    arm.add(wrist);
    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.092, 10, 8),
      handMaterial,
    );
    hand.scale.set(0.82, 1.05, 0.72);
    hand.position.y = 0.21;
    arm.add(hand);
    arm.position.set(side * 0.34, -0.35, -0.78);
    arm.rotation.x = -0.48;
    firstPersonRig.add(arm);
  }
  camera.add(firstPersonRig);

  const hemisphere = new THREE.HemisphereLight(0x78a8d4, 0x19261f, 1.45);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xffd6a3, 2.2);
  sun.position.set(420, 760, 280);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -520;
  sun.shadow.camera.right = 520;
  sun.shadow.camera.top = 520;
  sun.shadow.camera.bottom = -520;
  sun.shadow.camera.far = 1800;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(MAP_WIDTH + 600, MAP_HEIGHT + 600),
    new THREE.MeshStandardMaterial({ color: color.ground, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(MAP_WIDTH / 2, -0.4, MAP_HEIGHT / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  const roadMaterial = new THREE.MeshStandardMaterial({
    color: color.road,
    roughness: 0.92,
    metalness: 0.04,
  });
  const walkMaterial = new THREE.MeshStandardMaterial({
    color: color.sidewalk,
    roughness: 0.9,
  });
  for (const x of ROAD_X) {
    const walk = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH + 34, MAP_HEIGHT),
      walkMaterial,
    );
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(x, 0.04, MAP_HEIGHT / 2);
    walk.receiveShadow = true;
    scene.add(walk);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH, MAP_HEIGHT),
      roadMaterial,
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.08, MAP_HEIGHT / 2);
    road.receiveShadow = true;
    scene.add(road);
  }
  for (const z of ROAD_Y) {
    const walk = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_WIDTH, ROAD_WIDTH + 34),
      walkMaterial,
    );
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(MAP_WIDTH / 2, 0.05, z);
    walk.receiveShadow = true;
    scene.add(walk);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(MAP_WIDTH, ROAD_WIDTH),
      roadMaterial,
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(MAP_WIDTH / 2, 0.09, z);
    road.receiveShadow = true;
    scene.add(road);
  }

  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xc6b864 });
  for (const x of ROAD_X) {
    for (let z = 10; z < MAP_HEIGHT; z += 46) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 22), lineMaterial);
      line.position.set(x, 0.18, z);
      scene.add(line);
    }
  }
  for (const z of ROAD_Y) {
    for (let x = 10; x < MAP_WIDTH; x += 46) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(22, 0.25, 1.1), lineMaterial);
      line.position.set(x, 0.18, z);
      scene.add(line);
    }
  }

  const windowTransforms: THREE.Matrix4[] = [];
  for (const building of BUILDINGS) {
    scene.add(makeBuilding(building, windowTransforms));
  }
  const windows = addWindowInstances(scene, windowTransforms);

  const streetLights: THREE.Group[] = [];
  for (const x of ROAD_X) {
    for (let z = 75; z < MAP_HEIGHT; z += 155) {
      for (const side of [-1, 1]) {
        const light = makeStreetLight();
        light.position.set(x + side * (ROAD_WIDTH / 2 + 15), 0, z);
        light.rotation.y = side > 0 ? Math.PI : 0;
        scene.add(light);
        streetLights.push(light);
      }
    }
  }
  for (const z of ROAD_Y) {
    for (let x = 80; x < MAP_WIDTH; x += 165) {
      for (const side of [-1, 1]) {
        const light = makeStreetLight();
        light.position.set(x, 0, z + side * (ROAD_WIDTH / 2 + 15));
        light.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        scene.add(light);
        streetLights.push(light);
      }
    }
  }

  const trafficSignals: TrafficSignal[] = [];
  for (const x of ROAD_X) {
    for (const z of ROAD_Y) {
      for (const [dx, dz, rotation] of [
        [-42, -42, 0],
        [42, 42, Math.PI],
      ] as const) {
        const { group, signal } = makeTrafficLight();
        group.position.set(x + dx, 0, z + dz);
        group.rotation.y = rotation;
        scene.add(group);
        trafficSignals.push(signal);
      }
    }
  }

  const cars: AnimatedCar[] = [];
  for (let index = 0; index < 26; index++) {
    const car = makeCar(index);
    scene.add(car.group);
    cars.push(car);
  }
  const playerCar = makeCar(4);
  playerCar.group.scale.set(1.08, 1.08, 1.08);
  const headlightTarget = new THREE.Object3D();
  headlightTarget.position.set(90, 2, 0);
  playerCar.group.add(headlightTarget);
  for (const z of [-3.8, 3.8]) {
    const beam = new THREE.SpotLight(0xffe7b0, 78, 180, 0.36, 0.65, 1.2);
    beam.position.set(11, 7.2, z);
    beam.target = headlightTarget;
    playerCar.group.add(beam);
  }
  scene.add(playerCar.group);
  const chasePosition = new THREE.Vector3();
  let chaseReady = false;

  const npcs: AnimatedNpc[] = [];
  for (let index = 0; index < NPC_NAMES.length; index++) {
    const npc = makeNpc(index);
    scene.add(npc.group);
    npcs.push(npc);
  }

  const hookMaterial = new THREE.LineBasicMaterial({
    color: color.cyan,
    transparent: true,
    opacity: 0.58,
  });
  const hookLines: Array<{ id: string; line: THREE.Line }> = [];
  const hub = BUILDINGS.find((building) => building.id === "city-hall")!;
  const hubPoint = new THREE.Vector3(
    hub.x + hub.w / 2,
    46,
    hub.y + hub.h / 2,
  );
  for (const hook of HOOK_MODULES) {
    const building = BUILDINGS.find((item) => item.id === hook.buildingId)!;
    const points = [
      hubPoint,
      new THREE.Vector3(
        (hubPoint.x + building.x + building.w / 2) / 2,
        72 + (hook.id.length % 4) * 9,
        (hubPoint.z + building.y + building.h / 2) / 2,
      ),
      new THREE.Vector3(
        building.x + building.w / 2,
        42,
        building.y + building.h / 2,
      ),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(
      geometry,
      hookMaterial.clone(),
    );
    line.visible = hook.installedByDefault;
    scene.add(line);
    hookLines.push({ id: hook.id, line });
  }

  const rainCount = 1500;
  const rainPositions = new Float32Array(rainCount * 3);
  for (let index = 0; index < rainCount; index++) {
    rainPositions[index * 3] = Math.random() * 1000 - 500;
    rainPositions[index * 3 + 1] = Math.random() * 340;
    rainPositions[index * 3 + 2] = Math.random() * 1000 - 500;
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(rainPositions, 3),
  );
  const rain = new THREE.Points(
    rainGeometry,
    new THREE.PointsMaterial({
      color: 0x9ed3ec,
      size: 1.4,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  rain.visible = false;
  scene.add(rain);

  const update = (state: Rhoos3DState, delta: number) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (
      width > 0 &&
      height > 0 &&
      (canvas.width !== Math.floor(width * renderer.getPixelRatio()) ||
        canvas.height !== Math.floor(height * renderer.getPixelRatio()))
    ) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    const bob = state.moving
      ? Math.sin(state.elapsed * (state.sprinting ? 13 : 9)) *
        (state.sprinting ? 2.8 : 1.7)
      : Math.sin(state.elapsed * 1.4) * 0.18;
    sleeveMaterial.color.set(state.profile.jacket);
    handMaterial.color.set(state.profile.skin);
    wristMaterial.color.set(state.profile.accent);
    wristMaterial.emissive.set(state.profile.accent);
    firstPersonRig.visible = !state.vehicle.inCar;

    playerCar.group.position.set(state.vehicle.x, 0, state.vehicle.y);
    playerCar.group.rotation.y = -state.vehicle.angle;
    const wheelSpeed = state.vehicle.speed * delta * 0.15;
    for (const wheel of playerCar.wheels) wheel.rotation.z -= wheelSpeed;

    if (state.vehicle.inCar) {
      const speedRatio = THREE.MathUtils.clamp(Math.abs(state.vehicle.speed) / 390, 0, 1);
      const chaseDistance = 54 + speedRatio * 24;
      const desired = new THREE.Vector3(
        state.vehicle.x - Math.cos(state.vehicle.angle) * chaseDistance,
        31 + speedRatio * 11,
        state.vehicle.y - Math.sin(state.vehicle.angle) * chaseDistance,
      );
      if (!chaseReady) {
        chasePosition.copy(desired);
        chaseReady = true;
      }
      chasePosition.lerp(desired, 1 - Math.exp(-delta * 6.2));
      camera.position.copy(chasePosition);
      const lookAhead = 16 + speedRatio * 38;
      camera.lookAt(
        state.vehicle.x + Math.cos(state.vehicle.angle) * lookAhead,
        8,
        state.vehicle.y + Math.sin(state.vehicle.angle) * lookAhead,
      );
      const targetFov = 72 + speedRatio * 13;
      camera.fov += (targetFov - camera.fov) * Math.min(1, delta * 4);
      camera.updateProjectionMatrix();
    } else {
      chaseReady = false;
      camera.position.set(state.player.x, 42 + bob, state.player.y);
      camera.rotation.y = -state.player.angle - Math.PI / 2;
      camera.rotation.x = state.player.pitch;
      camera.fov += (72 - camera.fov) * Math.min(1, delta * 5);
      camera.updateProjectionMatrix();
      firstPersonRig.position.y = state.moving
        ? Math.sin(state.elapsed * (state.sprinting ? 13 : 9)) * 0.025
        : 0;
    }

    for (const car of cars) {
      const position = carPosition(car.index, state.elapsed);
      car.group.position.set(position.x, 0, position.z);
      car.group.rotation.y = position.angle;
      for (const wheel of car.wheels) wheel.rotation.z -= delta * 6;
    }

    for (const npc of npcs) {
      const current = npcPosition(npc.index, state.simMinutes);
      const next = npcPosition(npc.index, state.simMinutes + 0.9);
      npc.group.position.set(current.x, 0, current.z);
      const moving =
        Math.abs(next.x - current.x) + Math.abs(next.z - current.z) > 0.01;
      if (moving) {
        npc.group.rotation.y = Math.atan2(next.x - current.x, next.z - current.z);
        const walk = Math.sin(state.elapsed * 7 + npc.index) * 0.55;
        npc.leftLeg.rotation.x = walk;
        npc.rightLeg.rotation.x = -walk;
        npc.leftArm.rotation.x = -walk * 0.7;
        npc.rightArm.rotation.x = walk * 0.7;
      } else {
        npc.leftLeg.rotation.x = 0;
        npc.rightLeg.rotation.x = 0;
        npc.leftArm.rotation.x = 0;
        npc.rightArm.rotation.x = 0;
      }
    }

    const horizontalGreen = Math.floor(state.simMinutes / 5) % 2 === 0;
    for (const signal of trafficSignals) {
      signal.horizontal.color.setHex(horizontalGreen ? 0x65d6a6 : 0xff5f5b);
      signal.horizontal.emissive.copy(signal.horizontal.color);
      signal.vertical.color.setHex(horizontalGreen ? 0xff5f5b : 0x65d6a6);
      signal.vertical.emissive.copy(signal.vertical.color);
    }

    for (const { id, line } of hookLines) {
      line.visible =
        state.installedHooks.includes(id) && !state.disabledHooks.includes(id);
      const material = line.material as THREE.LineBasicMaterial;
      material.opacity = 0.38 + Math.sin(state.elapsed * 3 + id.length) * 0.2;
    }

    const hour = (state.simMinutes % 1440) / 60;
    const night = hour < 5.5 || hour > 19;
    const dusk =
      (hour >= 17 && hour <= 19) || (hour >= 5.5 && hour <= 7);
    const sky = night ? 0x090d24 : dusk ? 0x593752 : 0x6ca0bc;
    scene.background = new THREE.Color(sky);
    scene.fog!.color.setHex(night ? 0x11152b : dusk ? 0x765064 : 0x8eb1bb);
    (scene.fog as THREE.FogExp2).density =
      state.weather === "MIST" ? 0.00165 : state.weather === "RAIN" ? 0.00155 : 0.0009;
    hemisphere.intensity = night ? 0.72 : dusk ? 1.5 : 1.75;
    sun.intensity = night ? 0.18 : dusk ? 1.25 : 2.3;
    sun.color.setHex(night ? 0x7188c4 : dusk ? 0xff9b75 : 0xffdfb8);
    windows.lit.visible = true;
    (windows.lit.material as THREE.MeshStandardMaterial).emissiveIntensity =
      night ? 1.35 : dusk ? 0.8 : 0.18;
    windows.dark.visible = true;

    rain.visible = state.weather === "RAIN";
    if (rain.visible) {
      rain.position.set(state.player.x, 0, state.player.y);
      const positions = rainGeometry.attributes.position as THREE.BufferAttribute;
      for (let index = 0; index < rainCount; index++) {
        const nextY = positions.getY(index) - delta * 160;
        positions.setY(index, nextY < 0 ? 340 : nextY);
        positions.setX(index, positions.getX(index) - delta * 18);
      }
      positions.needsUpdate = true;
    }

    renderer.render(scene, camera);
  };

  const dispose = () => {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of materials) {
          const candidate = material as THREE.Material & { map?: THREE.Texture };
          candidate.map?.dispose();
          candidate.dispose();
        }
      }
      if (object instanceof THREE.Sprite) {
        object.material.map?.dispose();
        object.material.dispose();
      }
    });
    renderer.dispose();
  };

  return { update, dispose };
}
