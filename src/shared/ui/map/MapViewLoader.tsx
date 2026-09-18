"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./types";

/**
 * 지도 묶음을 CSR로 떼어낸다 — 청약 목록·상세는 SSR이라 첫 그림에 지도 코드가 끼어들면 안 된다.
 * 서버 컴포넌트에서 dynamic(ssr:false)를 직접 부르면 오류라, 이 래퍼가 클라이언트 경계를 맡는다.
 */
const KakaoMapView = dynamic(() => import("./KakaoMapView").then((m) => m.KakaoMapView), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface-tertiary" />
});

/** 크기는 바깥 상자가 잡는다 — 지도를 불러오는 동안에도 자리가 흔들리지 않게 */
export function MapViewLoader({ className, ...props }: MapViewProps) {
  return (
    <div className={className}>
      <KakaoMapView {...props} className="h-full w-full" />
    </div>
  );
}
