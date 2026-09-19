"use client";

import Image from "next/image";
import { useState } from "react";

// figma 135:3891 이미지 갤러리 — 메인 이미지 + 썸네일(선택 시 brand 링). 준비된 사진 수만큼만 그린다
export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];

  return (
    <div>
      {/* figma PC 135:3891(460+썸네일) / Mobile 419:8555(260+도트) */}
      <div className="relative h-[260px] overflow-hidden rounded-2xl border border-line-subtle bg-surface-secondary md:h-[460px] md:rounded-3xl" role="img" aria-label={name}>
        {current && <Image src={current} alt="" fill sizes="(min-width: 1024px) 620px, 100vw" priority className="object-cover" />}
      </div>

      {images.length > 1 && (
        <>
          {/* 모바일: 도트 인디케이터 */}
          <div className="mt-3 flex justify-center gap-1.5 md:hidden">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`${name} 이미지 ${i + 1}`}
                aria-pressed={selected === i}
                className={`h-1.5 rounded-full transition-all ${selected === i ? "w-4 bg-brand" : "w-1.5 bg-line-strong"}`}
              />
            ))}
          </div>

          {/* PC: 썸네일 */}
          <div className="mt-3 hidden gap-3 md:flex">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`${name} 이미지 ${i + 1}`}
                aria-pressed={selected === i}
                className={`relative h-20 w-20 overflow-hidden rounded-2xl bg-surface-tertiary ring-2 transition-shadow ${selected === i ? "ring-brand" : "ring-transparent"}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
