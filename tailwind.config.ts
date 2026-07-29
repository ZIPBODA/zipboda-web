import type { Config } from "tailwindcss";
// @zipboda/tokens Tailwind preset (raw 값). tokens/css 없이도 동작.
import zbPreset from "@zipboda/tokens/tailwind";

export default {
  presets: [zbPreset as Partial<Config>],
  content: [
    "./src/**/*.{ts,tsx}",
    // 공유 컴포넌트의 Tailwind 클래스 문자열 스캔(필수)
    "./node_modules/@zipboda/ui/dist/**/*.{js,mjs}",
    "./node_modules/@zipboda/ui-core/dist/**/*.{js,mjs}"
  ]
} satisfies Config;
