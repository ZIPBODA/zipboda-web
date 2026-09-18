/**
 * 저장소 TS 스크립트를 실행한다: node scripts/run-ts.cjs scripts/foo.ts [args]
 * vitest가 끌어오는 vite-node를 그대로 쓴다 — 새 의존성 없이 `@/` 별칭과 JSON import가 vitest.config.ts 설정대로 동작한다.
 */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const store = path.resolve(__dirname, "../node_modules/.pnpm");
const entry = fs
  .readdirSync(store)
  .filter((name) => name.startsWith("vite-node@"))
  .map((name) => path.join(store, name, "node_modules/vite-node/vite-node.mjs"))
  .find((candidate) => fs.existsSync(candidate));
if (!entry) {
  console.error("vite-node를 찾을 수 없습니다. pnpm install 후 다시 시도하세요.");
  process.exit(1);
}
// vitest.config.ts의 `@/` 별칭을 그대로 쓴다(vite-node 기본 탐색은 vite.config.*만 본다)
const result = spawnSync(process.execPath, [entry, "--config", "vitest.config.ts", ...process.argv.slice(2)], { stdio: "inherit", cwd: path.resolve(__dirname, "..") });
process.exit(result.status ?? 1);
