"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Floorplan } from "@/entities/floorplan";
import type { Axis, RigPose } from "../lib/types";
import { buildScene, type BuiltScene } from "../lib/buildScene";
import { isWebGLAvailable } from "../lib/detectWebGL";
import { FLOORPLAN_TABS, LOOK_DRAG_SENSITIVITY, MOUSE_LOOK_SENSITIVITY, PITCH_LIMIT_RAD, type FloorplanTab } from "../config/constants";
import { Scene2D } from "./Scene2D";
import { Scene3D } from "./Scene3D";
import { Joystick } from "./controls/Joystick";
import { MiniMap } from "./controls/MiniMap";
import { FloorplanUnsupported } from "./FloorplanUnsupported";

export interface FloorplanExperienceProps {
  floorplan: Floorplan;
  title: string;
  backHref: string;
  initialTab?: FloorplanTab;
  initialWalk?: boolean;
}

export default function FloorplanExperience({ floorplan, title, backHref, initialTab = "2d", initialWalk = false }: FloorplanExperienceProps) {
  const [tab, setTab] = useState<FloorplanTab>(initialTab);
  const [walk, setWalk] = useState(initialWalk);
  const [webgl, setWebgl] = useState<boolean | null>(null);

  const rigRef = useRef<RigPose>({ x: 0, z: 0, yaw: Math.PI, pitch: 0 });
  const moveRef = useRef<Axis>({ x: 0, y: 0 });
  const lookRef = useRef<Axis>({ x: 0, y: 0 });

  useEffect(() => {
    setWebgl(isWebGLAvailable());
  }, []);

  const scene = useMemo(() => (floorplan.model2d ? buildScene(floorplan.model2d) : null), [floorplan.model2d]);

  // ── 1인칭 워크스루 (풀스크린) ──
  if (walk) {
    if (webgl === false || scene === null) {
      return (
        <div className="flex min-h-dvh flex-col bg-surface">
          <TopBar title={title} backHref={backHref} onBack={() => setWalk(false)} />
          {scene === null ? (
            <ModelPending onView2D={() => { setWalk(false); setTab("2d"); }} />
          ) : (
            <FloorplanUnsupported onView2D={() => { setWalk(false); setTab("2d"); }} />
          )}
        </div>
      );
    }
    // 3D 캔버스가 화면 전체를 차지하고, 헤더·핫스팟·미니맵·컨트롤은 모두 오버레이로 올린다
    return (
      <div className="relative h-dvh w-full touch-none select-none overflow-hidden bg-surface">
        {webgl !== null && <Scene3D scene={scene} mode="walk" rigRef={rigRef} moveRef={moveRef} lookRef={lookRef} />}
        <LookDragLayer rigRef={rigRef} />

        {/* figma 353:3909 상단 오버레이 헤더 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={() => setWalk(false)}
            aria-label="뒤로"
            className="pointer-events-auto flex size-8 items-center justify-center rounded-2xl bg-black/50 text-white"
          >
            ←
          </button>
          <span className="pointer-events-auto rounded-2xl bg-black/50 px-3 py-1.5 text-caption font-medium text-white">1인칭 집구경</span>
          {/* 우측 자리를 비워 타이틀이 중앙에 오도록 뒤로 버튼과 같은 폭의 자리표시자 */}
          <span aria-hidden className="size-8" />
        </div>

        {/* figma 353:3926 미니맵 — 우측 상단 소형 오버레이 */}
        <div className="absolute right-4 top-14 flex w-28 flex-col gap-1 rounded-xl bg-black/50 p-1.5">
          <span className="text-2xsmall font-bold text-white">미니 도면 위치</span>
          <MiniMap scene={scene} rigRef={rigRef} />
        </div>

        {/* figma 353:3938 하단 컨트롤 — 모바일은 조이스틱 위, PC는 하단 */}
        <div className="absolute inset-x-4 bottom-28 flex justify-center md:bottom-6">
          <button type="button" onClick={() => setWalk(false)} className="rounded-lg border border-white/40 bg-black/50 px-6 py-3 text-compact font-medium text-white">
            도면으로 복귀
          </button>
        </div>

        {/* 조이스틱 — 터치(모바일)에서만. PC는 WASD + Pointer Lock 마우스 시선 */}
        <div className="contents md:hidden">
          <Joystick label="이동" side="left" onChange={(v) => (moveRef.current = v)} />
          <Joystick label="시점" side="right" onChange={(v) => (lookRef.current = v)} />
        </div>
      </div>
    );
  }

  // ── 2D / 3D(3인칭) ──
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface">
      <TopBar title={title} backHref={backHref} />

      {/* figma 353:3818 탭 선택 */}
      <nav aria-label="평면도 보기 전환" className="grid grid-cols-3 gap-1.5 px-4 pb-3">
        {FLOORPLAN_TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={active ? "true" : undefined}
              className={`rounded-lg border px-2 py-2 text-center text-compact ${
                active ? "border-brand bg-brand/10 font-bold text-fg-heading" : "border-line font-medium text-fg-muted"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "2d" && <Scene2D src={floorplan.image2dUrl} alt={`${title} 2D 평면도`} />}

      {tab === "3d" && <OrbitTab scene={scene} webgl={webgl} rigRef={rigRef} moveRef={moveRef} lookRef={lookRef} onView2D={() => setTab("2d")} onWalk={() => setWalk(true)} />}

      {tab === "location" && (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-medium text-fg-muted">위치 지도 준비 중</div>
      )}
    </div>
  );
}

interface OrbitTabProps {
  scene: BuiltScene | null;
  webgl: boolean | null;
  rigRef: React.MutableRefObject<RigPose>;
  moveRef: React.MutableRefObject<Axis>;
  lookRef: React.MutableRefObject<Axis>;
  onView2D: () => void;
  onWalk: () => void;
}

function OrbitTab({ scene, webgl, rigRef, moveRef, lookRef, onView2D, onWalk }: OrbitTabProps) {
  if (scene === null) return <ModelPending onView2D={onView2D} />;
  if (webgl === false) return <FloorplanUnsupported onView2D={onView2D} />;
  return (
    <>
      <div className="relative flex-1">
        {webgl !== null && <Scene3D scene={scene} mode="orbit" rigRef={rigRef} moveRef={moveRef} lookRef={lookRef} />}
        <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-2xsmall font-semibold text-white">
          3D 입체 레이아웃 뷰
        </span>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/40 px-2 py-1 text-2xsmall text-white">
          드래그로 회전 · 스크롤로 확대/축소
        </span>
      </div>
      {/* figma 353:3862 1인칭 워크스루 진입 */}
      <div className="p-4">
        <button type="button" onClick={onWalk} className="w-full rounded-xl bg-brand py-3.5 text-sm font-bold text-fg-heading shadow-md">
          1인칭 3D 워크스루 시작하기 ↗
        </button>
      </div>
    </>
  );
}

/** 2D 모델 미추출 유닛 — 3D는 도면 추출·검수 완료 후 제공 */
function ModelPending({ onView2D }: { onView2D: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-medium text-fg-muted">이 평면도의 3D 모델은 준비 중입니다</p>
      <button type="button" onClick={onView2D} className="rounded-lg border border-line px-4 py-2 text-compact font-medium text-fg-heading">
        2D 평면도 보기
      </button>
    </div>
  );
}

function TopBar({ title, backHref, onBack }: { title: string; backHref: string; onBack?: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-line-subtle bg-surface px-4 py-3">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="뒤로" className="shrink-0 text-lg text-fg-heading">
          ←
        </button>
      ) : (
        <Link href={backHref} aria-label="뒤로" className="shrink-0 text-lg text-fg-heading">
          ←
        </Link>
      )}
      <span className="truncate text-base font-bold text-fg-heading">{title}</span>
    </header>
  );
}

const clampPitch = (pitch: number) => Math.max(-PITCH_LIMIT_RAD, Math.min(PITCH_LIMIT_RAD, pitch));

/**
 * 시선 조작 레이어. 마우스는 클릭 시 Pointer Lock으로 FPS식 시선(ESC로 브라우저가 해제 → 포인터 복귀),
 * 잠금 미지원·터치/펜은 드래그 회전(터치는 보조로 시점 조이스틱도 사용)
 */
function LookDragLayer({ rigRef }: { rigRef: React.MutableRefObject<RigPose> }) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const layer = layerRef.current;
    const onLockChange = () => setLocked(document.pointerLockElement === layer);
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== layer) return;
      rigRef.current.yaw -= e.movementX * MOUSE_LOOK_SENSITIVITY;
      rigRef.current.pitch = clampPitch(rigRef.current.pitch - e.movementY * MOUSE_LOOK_SENSITIVITY);
    };
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("mousemove", onMouseMove);
    return () => {
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      // 워크스루 이탈 시 잠금이 남아 페이지 포인터가 사라지지 않도록
      if (layer && document.pointerLockElement === layer) document.exitPointerLock();
    };
  }, [rigRef]);

  const canLock = (e: React.PointerEvent) => e.pointerType === "mouse" && typeof layerRef.current?.requestPointerLock === "function";

  return (
    <div
      ref={layerRef}
      className={`absolute inset-0 ${locked ? "cursor-none" : "cursor-crosshair"}`}
      onPointerDown={(e) => {
        if (canLock(e)) {
          // 일부 브라우저는 Promise를 반환하며 사용자 제스처 제한으로 거부될 수 있다 — 거부 시 드래그로 대체
          const result = layerRef.current?.requestPointerLock() as unknown;
          if (result instanceof Promise) result.catch(() => undefined);
          return;
        }
        dragging.current = true;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!dragging.current) return;
        const dx = e.clientX - last.current.x;
        const dy = e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
        rigRef.current.yaw -= dx * LOOK_DRAG_SENSITIVITY;
        rigRef.current.pitch = clampPitch(rigRef.current.pitch - dy * LOOK_DRAG_SENSITIVITY);
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerLeave={() => {
        dragging.current = false;
      }}
    >
      <span className="pointer-events-none absolute bottom-20 left-1/2 hidden -translate-x-1/2 rounded-md bg-black/50 px-3 py-1.5 text-2xsmall text-white md:block">
        {locked ? "마우스로 시선 이동 중 · WASD 이동 · ESC를 누르면 마우스 포인터가 돌아옵니다" : "화면을 클릭하면 마우스로 시선 이동 · WASD 이동 · ESC로 마우스 해제"}
      </span>
    </div>
  );
}
