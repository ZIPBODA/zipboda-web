"use client";

import Image from "next/image";
import { useState } from "react";

// figma 135:3891 이미지 갤러리 — 메인 이미지 + 썸네일 3(선택 시 brand 링). 더미 1장이라 썸네일은 동일 이미지 반복
export function ProductGallery({ name, image }: { name: string; image?: string }) {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <div className="relative h-[460px] overflow-hidden rounded-3xl border border-line-subtle bg-surface-secondary" role="img" aria-label={name}>
        {image && <Image src={image} alt="" fill sizes="(min-width: 1024px) 620px, 100vw" priority className="object-cover" />}
      </div>
      <div className="mt-3 flex gap-3">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            aria-label={`${name} 이미지 ${i + 1}`}
            aria-pressed={selected === i}
            className={`relative h-20 w-20 overflow-hidden rounded-2xl bg-surface-tertiary ring-2 transition-shadow ${selected === i ? "ring-brand" : "ring-transparent"}`}
          >
            {image && <Image src={image} alt="" fill sizes="80px" className="object-cover" />}
          </button>
        ))}
      </div>
    </div>
  );
}
