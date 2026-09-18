const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (error) => console.error(error.message));
    await page.goto("http://localhost:3001/dev/floorplan-review?batch=1", { timeout: 120000 });
    await page.getByRole("button", { name: "일괄 추출 시작" }).click();
    const directory = path.resolve("data/housing-extraction");
    await fs.mkdir(directory, { recursive: true });
    let completed = -1;
    const deadline = Date.now() + 45 * 60 * 1000;
    while (Date.now() < deadline) {
      const results = JSON.parse(await page.getByRole("textbox", { name: "추출 보고서" }).inputValue());
      if (completed !== results.length) {
        completed = results.length;
        await fs.writeFile(path.join(directory, "report.json"), JSON.stringify(results, null, 2) + "\n");
        console.log(`${completed}: ${results.at(-1)?.layoutKey ?? "starting"} ${results.at(-1)?.status ?? ""}`);
      }
      if (await page.getByRole("button", { name: "일괄 추출 시작" }).isEnabled()) break;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!(await page.getByRole("button", { name: "일괄 추출 시작" }).isEnabled())) throw new Error("Batch timed out; partial report retained");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
