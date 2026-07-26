import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the RHOOS CITY game shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>RHOOS CITY — District One<\/title>/i);
  assert.match(html, /RHOOS CITY/);
  assert.match(html, /DISTRICT ONE/);
  assert.match(html, /A PROGRAMMABLE ECONOMIC CITY/);
  assert.match(html, /ENTER DISTRICT ONE/);
  assert.match(html, /CITY PULSE/);
  assert.match(html, /LOCAL SAVE READY/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/i);
});

test("keeps the city systems and metadata in source", async () => {
  const [game, data, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/rhoos-city.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/game-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(game, /function renderCity/);
  assert.match(game, /function runEconomy/);
  assert.match(game, /localStorage/);
  assert.match(game, /requestAnimationFrame/);
  assert.match(data, /Rhoos City Hall/);
  assert.match(data, /Automatic ore order/);
  assert.match(data, /NPC_NAMES/);
  assert.match(layout, /RHOOS CITY — District One/);
  assert.match(packageJson, /"name": "rhoos-city"/);
});
