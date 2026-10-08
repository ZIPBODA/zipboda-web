import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { WALK_RENDER_QUALITY } from "../config/constants";

export function WalkRenderQuality() {
  const { gl, setDpr } = useThree();
  const measurement = useRef({ elapsed: 0, frames: 0, warmup: WALK_RENDER_QUALITY.warmupS });

  useEffect(() => {
    const originalDpr = gl.getPixelRatio();
    return () => setDpr(originalDpr);
  }, [gl, setDpr]);

  useFrame((_, dt) => {
    const sample = measurement.current;
    if (document.hidden || sample.warmup > 0) {
      sample.warmup -= dt;
      sample.elapsed = 0;
      sample.frames = 0;
      return;
    }
    sample.elapsed += dt;
    sample.frames++;
    if (sample.elapsed < WALK_RENDER_QUALITY.sampleS) return;
    const fps = sample.frames / sample.elapsed;
    const dpr = gl.getPixelRatio();
    if (fps < WALK_RENDER_QUALITY.minFps && dpr > WALK_RENDER_QUALITY.minDpr) {
      setDpr(Math.max(WALK_RENDER_QUALITY.minDpr, dpr * WALK_RENDER_QUALITY.reduction));
    }
    sample.elapsed = 0;
    sample.frames = 0;
  });

  return null;
}
