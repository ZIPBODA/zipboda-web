/**
 * 홈 — 플레이스홀더.
 * 실제 화면(ZB-U-*)은 Figma 디자인을 기준으로 구현한다(.claude/rules/figma-implementation-rule.md).
 * 임의 디자인/레이아웃 구현 금지.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-h1 font-bold text-fg-heading">집보다</h1>
      <p className="mt-2 text-sm text-fg-muted">
        초기 플레이스홀더입니다. 화면은 Figma 디자인(node-id) 기준으로 구현됩니다.
      </p>
    </main>
  );
}
