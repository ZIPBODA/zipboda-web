"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CAMERA_FOV, CEILING_HEIGHT_M, EYE_HEIGHT_M, WALK_SPEED_MPS, resolveCollision, type SceneSegment } from "@/entities/floorplan";
import type { AxisRef, RigRef } from "../lib/types";
import { clampWallsToHeight, type BuiltScene, type SceneFixtureBox, type SceneFloorSlab, type SceneWallBox } from "../lib/buildScene";
import { floorTextureRepeat, wallTextureRepeat } from "../lib/textureRepeat";
import { useFinishTextures } from "../lib/useFinishTextures";
import {
  CAMERA_FAR_M,
  CAMERA_NEAR_M,
  DEVICE_PIXEL_RATIO_RANGE,
  FINISH_TILE_M,
  FIXTURE_COLOR,
  FLOOR_LIFT_M,
  FLOOR_THICKNESS_M,
  LOOK_SPEED_RAD_PER_S,
  MAX_FRAME_DT_S,
  ORBIT_CAMERA,
  ORBIT_WALL_HEIGHT_M,
  PITCH_LIMIT_RAD,
  SCENE_BACKGROUND,
  SCENE_LIGHT,
  WALL_COLOR,
  FINISH_TINT
} from "../config/constants";

export type SceneMode = "orbit" | "walk";

/** 벽마다 실척 반복 수가 다르므로 원본을 복제해 repeat만 바꾼다(GPU 텍스처는 source 공유) */
function repeatedClone(texture: THREE.Texture, repeat: { x: number; y: number }): THREE.Texture {
  const clone = texture.clone();
  clone.repeat.set(repeat.x, repeat.y);
  clone.needsUpdate = true;
  return clone;
}

// BoxGeometry 면 순서: +x, -x, +y, -y, +z, -z — 벽지는 넓은 면(±z)에만, 끝면·윗면(컷어웨이 단면)은 단색
function TexturedWall({ wall, wallpaper }: { wall: SceneWallBox; wallpaper: THREE.Texture }) {
  const map = useMemo(() => repeatedClone(wallpaper, wallTextureRepeat(wall.length, wall.height, FINISH_TILE_M.wallpaper)), [wallpaper, wall.length, wall.height]);
  return (
    <mesh position={[wall.cx, wall.yCenter, wall.cz]} rotation={[0, -wall.angleY, 0]}>
      <boxGeometry args={[wall.length, wall.height, wall.thickness]} />
      <meshStandardMaterial attach="material-0" color={WALL_COLOR} />
      <meshStandardMaterial attach="material-1" color={WALL_COLOR} />
      <meshStandardMaterial attach="material-2" color={WALL_COLOR} />
      <meshStandardMaterial attach="material-3" color={WALL_COLOR} />
      <meshStandardMaterial attach="material-4" color={FINISH_TINT} map={map} />
      <meshStandardMaterial attach="material-5" color={FINISH_TINT} map={map} />
    </mesh>
  );
}

function Walls({ walls, wallpaper }: { walls: SceneWallBox[]; wallpaper: THREE.Texture | null }) {
  return (
    <group>
      {walls.map((w, i) =>
        wallpaper ? (
          <TexturedWall key={i} wall={w} wallpaper={wallpaper} />
        ) : (
          <mesh key={i} position={[w.cx, w.yCenter, w.cz]} rotation={[0, -w.angleY, 0]}>
            <boxGeometry args={[w.length, w.height, w.thickness]} />
            <meshStandardMaterial color={WALL_COLOR} />
          </mesh>
        )
      )}
    </group>
  );
}

// ShapeGeometry는 XY 평면에 놓이므로 -90° 회전 후 (x, -z)로 넣어 씬 z와 일치시킨다
function floorShape(slab: SceneFloorSlab): THREE.Shape {
  const shape = new THREE.Shape();
  slab.polygon.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, -p.z) : shape.lineTo(p.x, -p.z)));
  shape.closePath();
  return shape;
}

// 장판은 전체가 한 장의 마감재이므로 텍스처가 있으면 방별 색을 곱하지 않는다(방 구분은 미니맵이 담당)
function Floors({ floors, flooring }: { floors: SceneFloorSlab[]; flooring: THREE.Texture | null }) {
  const shapes = useMemo(() => floors.map(floorShape), [floors]);
  const map = useMemo(() => (flooring ? repeatedClone(flooring, floorTextureRepeat(FINISH_TILE_M.flooring)) : null), [flooring]);
  return (
    <group>
      {floors.map((slab, i) => (
        <mesh key={slab.roomId} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_LIFT_M, 0]} receiveShadow>
          <extrudeGeometry args={[shapes[i], { depth: FLOOR_THICKNESS_M, bevelEnabled: false }]} />
          <meshStandardMaterial color={map ? FINISH_TINT : slab.color} map={map} />
        </mesh>
      ))}
    </group>
  );
}

function Fixtures({ fixtures }: { fixtures: SceneFixtureBox[] }) {
  return (
    <group>
      {fixtures.map((f, i) => (
        <mesh key={i} position={[f.cx, f.height / 2, f.cz]}>
          <boxGeometry args={[f.width, f.height, f.depth]} />
          <meshStandardMaterial color={FIXTURE_COLOR} />
        </mesh>
      ))}
    </group>
  );
}

function OrbitRig({ radius }: { radius: number }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, radius * ORBIT_CAMERA.heightRatio, radius * ORBIT_CAMERA.distanceRatio);
    camera.lookAt(0, 0, 0);
  }, [camera, radius]);
  return (
    <OrbitControls
      makeDefault
      target={[0, 0, 0]}
      enablePan={false}
      minDistance={radius * ORBIT_CAMERA.minDistanceRatio}
      maxDistance={radius * ORBIT_CAMERA.maxDistanceRatio}
      maxPolarAngle={Math.PI * ORBIT_CAMERA.maxPolarRatio}
    />
  );
}

function WalkRig({ rigRef, moveRef, lookRef, collision }: { rigRef: RigRef; moveRef: AxisRef; lookRef: AxisRef; collision: SceneSegment[] }) {
  const { camera } = useThree();
  const keys = useMemo(() => new Set<string>(), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [keys]);

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
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3(-dir.z, 0, dir.x);
    const dist = WALK_SPEED_MPS * step;
    const nx = rig.x + (dir.x * forward + right.x * strafe) * dist;
    const nz = rig.z + (dir.z * forward + right.z * strafe) * dist;
    const resolved = resolveCollision(nx, nz, collision);
    rig.x = resolved.x;
    rig.z = resolved.z;

    camera.position.set(rig.x, EYE_HEIGHT_M, rig.z);
    camera.rotation.set(rig.pitch, rig.yaw, 0, "YXZ");
  });

  return null;
}

interface Props {
  scene: BuiltScene;
  mode: SceneMode;
  rigRef: RigRef;
  moveRef: AxisRef;
  lookRef: AxisRef;
}

// figma 353:3799(3인칭)·353:3902(1인칭) 3D 씬 — 2D 모델에서 절차 생성한 벽(개구부 절개)·바닥·설비, 오빗/워크 리그 전환
export function Scene3D({ scene, mode, rigRef, moveRef, lookRef }: Props) {
  const radius = Math.max(scene.widthM, scene.depthM);
  const walls = useMemo(() => (mode === "walk" ? scene.walls : clampWallsToHeight(scene.walls, ORBIT_WALL_HEIGHT_M)), [scene.walls, mode]);
  const finish = useFinishTextures();

  useEffect(() => {
    if (mode !== "walk") return;
    rigRef.current.x = scene.spawn.x;
    rigRef.current.z = scene.spawn.z;
    rigRef.current.yaw = scene.spawn.yaw;
    rigRef.current.pitch = 0;
  }, [mode, scene.spawn, rigRef]);

  return (
    <Canvas
      // 기본 ACES 톤매핑은 흰 마감재를 회색으로 눌러 버린다 — 실내 스키매틱은 톤매핑 없이 원색 유지
      flat
      dpr={DEVICE_PIXEL_RATIO_RANGE}
      camera={{ fov: CAMERA_FOV, near: CAMERA_NEAR_M, far: CAMERA_FAR_M, position: [0, radius, radius] }}
      className="absolute inset-0"
    >
      <color attach="background" args={[SCENE_BACKGROUND[mode]]} />
      <ambientLight intensity={SCENE_LIGHT.ambient} />
      <hemisphereLight args={["#ffffff", "#9ca3af", SCENE_LIGHT.hemisphere]} />
      <directionalLight position={[3, CEILING_HEIGHT_M * 3, 5]} intensity={SCENE_LIGHT.directional} />
      <Floors floors={scene.floors} flooring={finish.flooring} />
      <Walls walls={walls} wallpaper={finish.wallpaper} />
      <Fixtures fixtures={scene.fixtures} />
      {mode === "orbit" ? <OrbitRig radius={radius} /> : <WalkRig rigRef={rigRef} moveRef={moveRef} lookRef={lookRef} collision={scene.collision} />}
    </Canvas>
  );
}
