"use client";

import { useState } from "react";

// figma 135:3891 이미지 갤러리 — 메인 이미지 + 썸네일 3(선택 시 brand 링). 실 이미지 연동 전 플레이스홀더
export function ProductGallery({ name }: { name: string }) {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="h-[460px] rounded-3xl border border-line-subtle bg-surface-secondary" role="img" aria-label={name} />
      <div className="mt-3 flex gap-3">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            aria-label={`${name} 이미지 ${i + 1}`}
            aria-pressed={selected === i}
            className={`h-20 w-20 rounded-2xl bg-surface-tertiary ring-2 transition-shadow ${selected === i ? "ring-brand" : "ring-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
}
