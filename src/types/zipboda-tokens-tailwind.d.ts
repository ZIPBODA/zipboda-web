// @zipboda/tokens/tailwind(CJS preset)에 대한 타입 선언.
// 패키지가 ./tailwind 서브패스에 타입을 노출하기 전까지의 소비처 shim.
declare module "@zipboda/tokens/tailwind" {
  import type { Config } from "tailwindcss";
  const preset: Partial<Config>;
  export default preset;
}
