import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the player and career game shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>RHOOS CITY — Player &amp; Career Engine<\/title>/i,
  );
  assert.match(html, /MULTI-SYSTEM PLAYER ENGINE/);
  assert.match(html, /Build a life\./);
  assert.match(html, /Build the city\./);
  assert.match(html, /HOOKTECH OPERATING SYSTEM/);
  assert.match(html, /ENTER 3D CITY \+ MUSIC/);
  assert.match(html, /PLAYER \+ CAREER \+ WORK \+ ECONOMY ENGINE/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("keeps the player, career, WebGL, soundtrack, and HookTech engines in source", async () => {
  const [game, threeEngine, soundEngine, data, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/rhoos-live-city.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/rhoos-three-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/rhoos-sound-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/game-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(game, /createRhoosThreeEngine/);
  assert.match(game, /hitWorkGame/);
  assert.match(game, /CAREER_TRACKS/);
  assert.match(game, /defaultProfile/);
  assert.match(game, /PLAYER \/ CAREER ENGINE/);
  assert.match(game, /career-match-badge/);
  assert.match(game, /requestPointerLock/);
  assert.match(game, /function runEconomy/);
  assert.match(game, /function addPacket/);
  assert.match(game, /localStorage/);
  assert.match(threeEngine, /new THREE\.WebGLRenderer/);
  assert.match(threeEngine, /function makeCar/);
  assert.match(threeEngine, /function makeNpc/);
  assert.match(threeEngine, /firstPersonRig/);
  assert.match(soundEngine, /AudioContext/);
  assert.match(soundEngine, /private tick/);
  assert.match(soundEngine, /private startAmbience/);
  assert.match(data, /HOOK_MODULES/);
  assert.match(data, /Shift-to-Earn/);
  assert.match(data, /Traffic Oracle/);
  assert.match(layout, /Player & Career Engine/);
  assert.match(layout, /summary_large_image/);
  assert.match(packageJson, /"name": "rhoos-city"/);
});
