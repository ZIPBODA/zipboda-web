const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const store = path.join(root, "node_modules/.pnpm");
const wsPackage = fs.readdirSync(store).find((name) => name.startsWith("ws@"));
const WebSocket = require(path.join(store, wsPackage, "node_modules/ws"));
const output = path.join(root, "tmp/housing-review/browser");
fs.mkdirSync(output, { recursive: true });
const request = (method, route) => new Promise((resolve, reject) => {
  const req = http.request({ host: "127.0.0.1", port: 9222, path: route, method }, (response) => {
    let data = "";
    response.on("data", (chunk) => { data += chunk; });
    response.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
  });
  req.on("error", reject);
  req.end();
});
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const target = await request("PUT", "/json/new?about:blank");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.once("open", resolve));
  let sequence = 0;
  const pending = new Map();
  let errors = [];
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, { resolve, reject, timeout });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.on("message", (raw) => {
    const message = JSON.parse(raw);
    const callback = pending.get(message.id);
    if (callback) {
      clearTimeout(callback.timeout);
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(JSON.stringify(message.error)));
      else callback.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown") {
      errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    } else if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
    }
  });
  const evaluate = async (expression) => {
    const response = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const until = async (expression) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      try { if (await evaluate(expression)) return; } catch {}
      await sleep(500);
    }
    throw new Error(`Browser condition timed out: ${expression}`);
  };
  const screenshot = async (name) => {
    const shot = await send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(shot.data, "base64"));
  };
  const results = [];
  try {
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Network.enable");
    await send("Network.setCacheDisabled", { cacheDisabled: true });
    for (const width of [360, 767, 768, 1280]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
      await send("Page.navigate", { url: "http://localhost:3001/subscriptions/dobong-banghak" });
      await until("[...document.querySelectorAll('a')].some(a=>a.offsetWidth && a.href.includes('unit=dobong-banghak-2-3-02'))");
      await sleep(1500);
      errors = [];
      const before = await evaluate(`(() => {
        const link = [...document.querySelectorAll('a')].find(a=>a.offsetWidth && a.href.includes('unit=dobong-banghak-2-3-02') && !a.href.includes('/floorplan'));
        link.scrollIntoView({block:'center'});
        window.__housingNavMarker = true;
        return { y:scrollY, href:link.href, linkY:link.getBoundingClientRect().top };
      })()`);
      await screenshot(`unit-${width}-before`);
      await evaluate(`[...document.querySelectorAll('a')].find(a=>a.offsetWidth && a.href===${JSON.stringify(before.href)}).click()`);
      await until(`location.href === ${JSON.stringify(before.href)} && [...document.querySelectorAll('a[aria-current="true"]')].some(a=>a.href===location.href && a.offsetWidth)`);
      await sleep(1000);
      const after = await evaluate("({y:scrollY, marker:window.__housingNavMarker, width:document.documentElement.scrollWidth})");
      assert.equal(after.marker, true, "평형 전환이 문서를 리로드했습니다");
      assert.ok(Math.abs(before.y - after.y) <= 2, `스크롤 이동 ${width}: ${before.y} → ${after.y}`);
      assert.deepEqual(errors, []);
      await screenshot(`unit-${width}-after`);
      results.push({ type: "unit", width, before: before.y, after: after.y, horizontalOverflow: Math.max(0, after.width-width), errors });
      if (width < 768) {
        const tab = await evaluate(`(() => { const a=[...document.querySelectorAll('a')].find(a=>a.offsetWidth && a.href.includes('tab=3d')); a.scrollIntoView({block:'center'}); return {href:a.href,y:scrollY}; })()`);
        await evaluate(`[...document.querySelectorAll('a')].find(a=>a.href===${JSON.stringify(tab.href)}).click()`);
        await until(`location.href === ${JSON.stringify(tab.href)}`);
        await sleep(1000);
        const y = await evaluate("scrollY");
        assert.ok(Math.abs(tab.y-y) <= 2, `탭 스크롤 이동: ${tab.y} → ${y}`);
        await screenshot(`tab-${width}`);
        results.push({ type: "tab", width, before: tab.y, after: y });
      }
      console.log(`navigation ${width}: passed`);
    }
    for (const key of process.argv.slice(2)) {
      const property = key.split("-").slice(0, 2).join("-");
      for (const width of [360, 1280]) {
        await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
        for (const mode of ["orbit", "walk"]) {
          errors = [];
          await send("Page.navigate", { url: `http://localhost:3001/subscriptions/${property}/floorplan?unit=${key}&view=3d&mode=${mode}` });
          await until("!!document.querySelector('canvas')");
          await sleep(3000);
          const canvas = await evaluate("(() => {const c=document.querySelector('canvas'); return {width:c.width,height:c.height,text:document.body.innerText};})()");
          assert.ok(canvas.width > 0 && canvas.height > 0);
          assert.deepEqual(errors, []);
          await screenshot(`${key}-${width}-${mode}`);
          results.push({ type: "3d", key, width, mode, canvas, errors });
          console.log(`${key} ${width} ${mode}: passed`);
        }
      }
    }
  } finally {
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2) + "\n");
    ws.close();
    await request("GET", `/json/close/${target.id}`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
