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

test("server-renders the NFT work TCG shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>RHOOS CITY — NFT Work TCG<\/title>/i,
  );
  assert.match(html, /NFT WORK TCG \/ LIVING CITY ENGINE/);
  assert.match(html, /Drive the city\./);
  assert.match(html, /Build a life\./);
  assert.match(html, /HOOKTECH CARD PROTOCOL/);
  assert.match(html, /ENTER 3D CITY \+ MUSIC/);
  assert.match(html, /DRIVING \+ NFT CHARACTER \+ WORK TCG \+ CITY ECONOMY/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("keeps the NFT, unique card, corporate, WebGL, soundtrack, and HookTech engines in source", async () => {
  const [game, cards, companies, wallet, threeEngine, soundEngine, data, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/rhoos-live-city.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/tcg-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/corporate-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/nft-wallet.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/rhoos-three-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/rhoos-sound-engine.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/game-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(game, /createRhoosThreeEngine/);
  assert.match(game, /playWorkCard/);
  assert.match(game, /cardLiveBonus/);
  assert.match(game, /createCardInstance/);
  assert.match(game, /RHO-86/);
  assert.match(game, /handbrake/);
  assert.match(game, /vehicle\.odometer/);
  assert.match(game, /CAREER_TRACKS/);
  assert.match(game, /defaultProfile/);
  assert.match(game, /NFT CHARACTER \/ WORK TCG/);
  assert.match(game, /career-match-badge/);
  assert.match(game, /requestPointerLock/);
  assert.match(game, /function runEconomy/);
  assert.match(game, /function addPacket/);
  assert.match(game, /localStorage/);
  assert.match(threeEngine, /new THREE\.WebGLRenderer/);
  assert.match(threeEngine, /function makeCar/);
  assert.match(threeEngine, /chasePosition/);
  assert.match(threeEngine, /SpotLight/);
  assert.match(threeEngine, /function makeNpc/);
  assert.match(threeEngine, /firstPersonRig/);
  assert.match(soundEngine, /AudioContext/);
  assert.match(soundEngine, /private tick/);
  assert.match(soundEngine, /private startAmbience/);
  assert.match(soundEngine, /setDriving/);
  assert.match(data, /HOOK_MODULES/);
  assert.match(data, /Shift-to-Earn/);
  assert.match(data, /Traffic Oracle/);
  assert.match(cards, /CITY_CARDS/);
  assert.match(cards, /STARTER_DECK/);
  assert.match(companies, /JPMorgan Chase/);
  assert.match(companies, /District Boss/);
  assert.match(wallet, /eth_requestAccounts/);
  assert.match(wallet, /0x6352211e/);
  assert.doesNotMatch(wallet, /eth_sendTransaction|wallet_sendCalls/);
  assert.match(layout, /NFT Work TCG/);
  assert.match(layout, /summary_large_image/);
  assert.match(packageJson, /"name": "rhoos-city"/);
});
