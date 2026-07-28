import { Button, Badge, Chip, Tab, Input } from "@/shared/ui";

/**
 * 디자인시스템 소비 검증용 쇼케이스.
 * @zipboda/ui 컴포넌트 + @zipboda/tokens Tailwind preset(색/간격/radius)이 정상 적용되는지 확인한다.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <header className="space-y-1">
        <h1 className="text-h1 font-bold text-fg-heading">집보다 · 디자인시스템 소비 검증</h1>
        <p className="text-sm text-fg-muted">@zipboda/ui + @zipboda/tokens(Tailwind preset)</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Button</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">지금 신청하기</Button>
          <Button variant="secondary">보조</Button>
          <Button variant="outline">아웃라인</Button>
          <Button variant="ghost">고스트</Button>
          <Button variant="dark">다크</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Badge</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="success">배송완료</Badge>
          <Badge variant="error">D-3 마감임박</Badge>
          <Badge variant="info">정보</Badge>
          <Badge variant="neutral">저장됨</Badge>
          <Badge variant="dark">Dark</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Chip / Tab</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="active">전체</Chip>
          <Chip variant="default">LH</Chip>
          <Chip variant="default">SH</Chip>
          <Chip variant="outline">59㎡</Chip>
        </div>
        <div className="flex items-center gap-1 border-b border-line">
          <Tab active>청약 신청</Tab>
          <Tab>찜 목록</Tab>
          <Tab>주문내역</Tab>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Input</h2>
        <div className="max-w-sm">
          <Input placeholder="주택, 가구 검색..." />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-h4 font-semibold">Tokens (preset 적용 확인)</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Swatch className="bg-brand text-fg-ondark" label="brand" />
          <Swatch className="bg-status-success text-fg-ondark" label="success" />
          <Swatch className="bg-status-error text-fg-ondark" label="error" />
          <Swatch className="bg-admin-status-info text-fg-ondark" label="admin-info" />
        </div>
      </section>
    </main>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className={`flex h-14 items-end rounded-lg p-2 text-xs font-semibold ${className}`}>{label}</div>
  );
}
