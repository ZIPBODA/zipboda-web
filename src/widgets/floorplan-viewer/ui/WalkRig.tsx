"use client";

import { useEffect, useLayoutEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EYE_HEIGHT_M, WALK_SPEED_MPS, resolveCollision, type SceneSegment } from "@/entities/floorplan";
import { FLOOR_LIFT_M, LOOK_SPEED_RAD_PER_S, MAX_FRAME_DT_S, PITCH_LIMIT_RAD, WALK_CAMERA } from "../config/constants";
import type { BuiltScene } from "../lib/buildScene";
import type { AxisRef, RigRef } from "../lib/types";
import { walkVerticalFov } from "../lib/walkCamera";

export function WalkRig({ rigRef, moveRef, lookRef, collision, spawn }: { rigRef: RigRef; moveRef: AxisRef; lookRef: AxisRef; collision: SceneSegment[]; spawn: BuiltScene["spawn"] }) {
  const { camera, size } = useThree();
  const keys = useMemo(() => new Set<string>(), []);

  useLayoutEffect(() => {
    Object.assign(rigRef.current, spawn, { pitch: WALK_CAMERA.initialPitchRad });
    moveRef.current = { x: 0, y: 0 };
    lookRef.current = { x: 0, y: 0 };
    camera.position.set(spawn.x, EYE_HEIGHT_M + FLOOR_LIFT_M, spawn.z);
    camera.rotation.set(WALK_CAMERA.initialPitchRad, spawn.yaw, 0, "YXZ");
  }, [camera, spawn, rigRef, moveRef, lookRef]);

  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const previousFov = camera.fov;
    camera.fov = walkVerticalFov(size.width / size.height);
    camera.updateProjectionMatrix();
    return () => {
      camera.fov = previousFov;
      camera.updateProjectionMatrix();
    };
  }, [camera, size.width, size.height]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const reset = () => {
      keys.clear();
      moveRef.current = { x: 0, y: 0 };
      lookRef.current = { x: 0, y: 0 };
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
      reset();
    };
  }, [keys, moveRef, lookRef]);

  useFrame((_, dt) => {
    const rig = rigRef.current;
    const step = Math.min(dt, MAX_FRAME_DT_S);

    rig.yaw -= lookRef.current.x * LOOK_SPEED_RAD_PER_S * step;
    rig.pitch -= lookRef.current.y * LOOK_SPEED_RAD_PER_S * step;
    rig.pitch = Math.max(-PITCH_LIMIT_RAD, Math.min(PITCH_LIMIT_RAD, rig.pitch));

    let forward = -moveRef.current.y;
    let strafe = moveRef.current.x;
    if (keys.has("w") || keys.has("arrowup")) forward += 1;
    if (keys.has("s") || keys.has("arrowdown")) forward -= 1;
    if (keys.has("d") || keys.has("arrowright")) strafe += 1;
    if (keys.has("a") || keys.has("arrowleft")) strafe -= 1;
    const mag = Math.hypot(forward, strafe);
    if (mag > 1) {
      forward /= mag;
      strafe /= mag;
    }

    // 카메라 실제 전방(수평) 기준 이동. 우측 = forward × up(Y) = (-fz, 0, fx) — 부호가 바뀌면 A/D가 뒤집힌다
    const dir = new THREE.Vector3(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw));
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const dist = WALK_SPEED_MPS * step;
    const nx = rig.x + (dir.x * forward + right.x * strafe) * dist;
    const nz = rig.z + (dir.z * forward + right.z * strafe) * dist;
    const resolved = resolveCollision(nx, nz, collision);
    rig.x = resolved.x;
    rig.z = resolved.z;

    camera.position.set(rig.x, EYE_HEIGHT_M + FLOOR_LIFT_M, rig.z);
    camera.rotation.set(rig.pitch, rig.yaw, 0, "YXZ");
  });

  return null;
}

