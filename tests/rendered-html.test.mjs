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
    /<title>RHOOS CITY — Work\. Own\. Lead\.<\/title>/i,
  );
  assert.match(html, /NFT WORK TCG \/ LIVING CITY ENGINE/);
  assert.match(html, /Move freely\./);
  assert.match(html, /Build a life\./);
  assert.match(html, /HOOKTECH CARD PROTOCOL/);
  assert.match(html, /SELECT A HOOK PASS TO ENTER/);
  assert.match(html, /STREET LAYER \+ NEIGHBORHOOD SPAWNS \+ WALK-UP WORK \+ TRAFFIC NETWORK/);
  assert.match(html, /og\.png/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("keeps the broker economy, mayor progression, NFT, WebGL, and HookTech engines in source", async () => {
  const [game, economy, valueEconomy, governance, cards, companies, wallet, threeEngine, soundEngine, data, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/rhoos-live-city.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/economy-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/value-economy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/city-governance.ts", import.meta.url), "utf8"),
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
  assert.match(game, /METRO GT/);
  assert.match(game, /CAB-7 CITY TAXI/);
  assert.match(game, /getNearestDriveableCar/);
  assert.match(game, /getNearestNpc/);
  assert.match(game, /SHOW ME THE JOBS/);
  assert.match(game, /mini-map-world/);
  assert.match(game, /cityLocation/);
  assert.match(game, /HOOK_PASSES/);
  assert.match(game, /purchaseHookPass/);
  assert.match(game, /ENTRY LOCKED \/ PURCHASE A V4 HOOK PASS FIRST/);
  assert.match(game, /SPAWN_POINTS/);
  assert.match(game, /STREET_GIGS/);
  assert.match(game, /Sakura Express/i);
  assert.match(game, /ROADSIDE REPAIR/);
  assert.match(game, /acceptStreetGig/);
  assert.match(game, /streetLayer\.earnings/);
  assert.match(game, /TRAFFIC NETWORK \/ LIVE/);
  assert.match(game, /handbrake/);
  assert.match(game, /vehicle\.odometer/);
  assert.match(game, /navigator\.getGamepads/);
  assert.match(game, /dampAngle/);
  assert.match(game, /CAREER_TRACKS/);
  assert.match(game, /defaultProfile/);
  assert.match(game, /NFT CHARACTER \/ WORK TCG/);
  assert.match(game, /career-match-badge/);
  assert.match(game, /requestPointerLock/);
  assert.match(game, /function runEconomy/);
  assert.match(game, /RHOOS BROKER TERMINAL \/ CITY GOVERNANCE/);
  assert.match(game, /buyEconomyAsset/);
  assert.match(game, /sellEconomyAsset/);
  assert.match(game, /assetPortfolioValue/);
  assert.match(game, /shareCooperationOnX/);
  assert.match(game, /https:\/\/x\.com\/intent\/tweet/);
  assert.match(game, /DEVICE-LOCAL PROTOTYPE GAME STATE WITH NO CASH VALUE/);
  assert.match(game, /clockInBroker/);
  assert.match(game, /runForMayor/);
  assert.match(game, /enactCivicPolicy/);
  assert.match(game, /WITHDRAWALS LOCKED/);
  assert.match(game, /No magic emissions/);
  assert.match(game, /function addPacket/);
  assert.match(game, /localStorage/);
  assert.match(threeEngine, /new THREE\.WebGLRenderer/);
  assert.match(threeEngine, /function makeCar/);
  assert.match(threeEngine, /chasePosition/);
  assert.match(threeEngine, /SpotLight/);
  assert.match(threeEngine, /makePlayerCharacter/);
  assert.match(threeEngine, /driveableCars/);
  assert.match(threeEngine, /makeStreetSignSprite/);
  assert.match(threeEngine, /makeStreetJobBeacon/);
  assert.match(threeEngine, /streetJobBeacons/);
  assert.match(threeEngine, /followPosition/);
  assert.match(threeEngine, /function makeNpc/);
  assert.match(threeEngine, /firstPersonRig/);
  assert.match(soundEngine, /AudioContext/);
  assert.match(soundEngine, /private tick/);
  assert.match(soundEngine, /private startAmbience/);
  assert.match(soundEngine, /setDriving/);
  assert.match(data, /HOOK_MODULES/);
  assert.match(data, /Shift-to-Earn/);
  assert.match(data, /Traffic Oracle/);
  assert.match(economy, /ECONOMY_ASSETS/);
  assert.match(economy, /COOPERATIVES/);
  assert.match(economy, /Courier Bike/);
  assert.match(economy, /Freight Route Permit/);
  assert.match(economy, /Harbor Hands/);
  assert.match(economy, /Central Loop Collective/);
  assert.match(valueEconomy, /MARKET_FEE_BPS = 250/);
  assert.match(valueEconomy, /RESERVE_SHARE_BPS = 6000/);
  assert.match(valueEconomy, /VALUE_READINESS/);
  assert.match(valueEconomy, /quoteTrade/);
  assert.match(governance, /MAYOR_REQUIREMENTS/);
  assert.match(governance, /reputation: 60/);
  assert.match(governance, /Jobs First/);
  assert.match(governance, /Transit Flow/);
  assert.match(cards, /CITY_CARDS/);
  assert.match(cards, /STARTER_DECK/);
  assert.match(companies, /JPMorgan Chase/);
  assert.match(companies, /District Boss/);
  assert.match(wallet, /eth_requestAccounts/);
  assert.match(wallet, /0x6352211e/);
  assert.doesNotMatch(wallet, /eth_sendTransaction|wallet_sendCalls/);
  assert.match(layout, /Work\. Own\. Lead\./);
  assert.match(layout, /Become Mayor/);
  assert.match(layout, /summary_large_image/);
  assert.match(packageJson, /"name": "rhoos-city"/);
});
