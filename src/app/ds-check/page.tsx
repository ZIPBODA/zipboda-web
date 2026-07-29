import { Button, Badge, Chip, Tab, Input } from "@/shared/ui";

/**
 * ⚠ 개발 전용 — 디자인시스템 "소비 검증" 페이지 (제품 화면/디자인 아님).
 * @zipboda/ui 컴포넌트 + @zipboda/tokens Tailwind preset이 정상 적용되는지 확인용.
 * 실제 화면은 Figma 기준으로 구현하며, 이 라우트는 검증 후 제거 가능.
 */
export default function DsCheck() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-1">
        <h1 className="text-h1 font-bold text-fg-heading">DS 소비 검증 (개발용)</h1>
        <p className="text-sm text-fg-muted">@zipboda/ui + @zipboda/tokens(Tailwind preset) · 제품 디자인 아님</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="dark">Dark</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Badge / Chip / Tab / Input</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="neutral">Neutral</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="active">Active</Chip>
          <Chip variant="default">Default</Chip>
          <Chip variant="outline">Outline</Chip>
        </div>
        <div className="flex items-center gap-1 border-b border-line">
          <Tab active>Tab A</Tab>
          <Tab>Tab B</Tab>
        </div>
        <div className="max-w-sm">
          <Input placeholder="Input 검증" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Tokens (preset)</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex h-14 items-end rounded-lg bg-brand p-2 text-xs font-semibold text-fg-ondark">brand</div>
          <div className="flex h-14 items-end rounded-lg bg-status-success p-2 text-xs font-semibold text-fg-ondark">success</div>
          <div className="flex h-14 items-end rounded-lg bg-status-error p-2 text-xs font-semibold text-fg-ondark">error</div>
          <div className="flex h-14 items-end rounded-lg bg-admin-status-info p-2 text-xs font-semibold text-fg-ondark">admin-info</div>
        </div>
      </section>
    </main>
  );
}
