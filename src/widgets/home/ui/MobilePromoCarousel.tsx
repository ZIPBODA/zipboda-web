"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { HOME_PROMO_SLIDES } from "../config/constants";

const AUTO_ADVANCE_MS = 4000;

// figma 419:10668 모바일 프로모 캐러셀 — 168 배너 + 그라디언트 + 도트/카운터(1/3)
export function MobilePromoCarousel() {
  const [index, setIndex] = useState(0);
  const count = HOME_PROMO_SLIDES.length;

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [count]);

  const slide = HOME_PROMO_SLIDES[index];

  return (
    <div className="bg-surface px-3 pb-2 pt-4">
      <div className="relative h-[168px] overflow-hidden rounded-xl bg-surface-tertiary">
        <Image src={slide.image} alt="" fill priority sizes="368px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-4">
          {slide.badge && (
            <span className="mb-2 w-fit rounded-full bg-brand px-2 py-0.5 text-caption font-bold text-brand-on">{slide.badge}</span>
          )}
          <p className="text-sm font-bold text-fg-ondark">{slide.title}</p>
          <p className="mt-0.5 text-2xsmall text-white/65">{slide.subtitle}</p>
        </div>

        <span className="absolute right-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-caption text-fg-ondark">
          {index + 1}/{count}
        </span>
        <div className="absolute bottom-3 left-4 flex gap-1.5">
          {HOME_PROMO_SLIDES.map((item, dot) => (
            <button
              key={item.title}
              type="button"
              aria-label={`${dot + 1}번째 배너 보기`}
              aria-current={dot === index}
              onClick={() => setIndex(dot)}
              className={`h-1.5 rounded-full transition-all ${dot === index ? "w-4 bg-brand" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
