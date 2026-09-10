"use client";

import { useEffect, useRef } from "react";
import type { RigRef } from "../../lib/types";
import type { BuiltScene } from "../../lib/buildScene";
import { MINIMAP_CANVAS, MINIMAP_COLOR, MINIMAP_POSE } from "../../config/constants";

// figma 353:3930 미니 도면 — 방 바닥 + 벽 + 현재 위치·응시 방향 콘. rigRef를 rAF로 읽어 리렌더 없이 그린다
export function MiniMap({ scene, rigRef }: { scene: BuiltScene; rigRef: RigRef }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width: W, height: H, padding } = MINIMAP_CANVAS;
    const scale = Math.min((W - padding * 2) / scene.widthM, (H - padding * 2) / scene.depthM);
    // 씬 좌표는 중앙 원점 → 캔버스 중앙에 정렬
    const toPx = (x: number, z: number) => [W / 2 + x * scale, H / 2 + z * scale] as const;
    const rotate = (vx: number, vz: number, a: number) => [vx * Math.cos(a) - vz * Math.sin(a), vx * Math.sin(a) + vz * Math.cos(a)] as const;

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      for (const slab of scene.floors) {
        ctx.fillStyle = slab.color;
        ctx.beginPath();
        slab.polygon.forEach((p, i) => {
          const [x, y] = toPx(p.x, p.z);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = MINIMAP_COLOR.wall;
      ctx.lineWidth = MINIMAP_POSE.wallWidthPx;
      ctx.lineCap = "round";
      for (const s of scene.collision) {
        const [x1, y1] = toPx(s.x1, s.z1);
        const [x2, y2] = toPx(s.x2, s.z2);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      const pose = rigRef.current;
      const [px, py] = toPx(pose.x, pose.z);
      // three.js 카메라 전방 = (-sin yaw, -cos yaw)
      const fx = -Math.sin(pose.yaw);
      const fz = -Math.cos(pose.yaw);
      const [lx, lz] = rotate(fx, fz, -MINIMAP_POSE.coneHalfAngleRad);
      const [rx, rz] = rotate(fx, fz, MINIMAP_POSE.coneHalfAngleRad);
      ctx.fillStyle = MINIMAP_COLOR.cone;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + lx * MINIMAP_POSE.coneLengthPx, py + lz * MINIMAP_POSE.coneLengthPx);
      ctx.lineTo(px + rx * MINIMAP_POSE.coneLengthPx, py + rz * MINIMAP_POSE.coneLengthPx);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = MINIMAP_COLOR.pose;
      ctx.beginPath();
      ctx.arc(px, py, MINIMAP_POSE.radiusPx, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = MINIMAP_COLOR.poseStroke;
      ctx.lineWidth = MINIMAP_POSE.strokeWidthPx;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [scene, rigRef]);

  return (
    <canvas
      ref={canvasRef}
      width={MINIMAP_CANVAS.width}
      height={MINIMAP_CANVAS.height}
      className="h-auto w-full rounded-lg bg-surface"
      aria-label="미니 도면 위치"
    />
  );
}
