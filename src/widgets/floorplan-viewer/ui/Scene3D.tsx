"use client";

import { useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { CAMERA_FOV, CEILING_HEIGHT_M } from "@/entities/floorplan";
import type { AxisRef, RigRef } from "../lib/types";
import { clampWallsToHeight, type BuiltScene, type SceneFixtureBox, type SceneFloorSlab, type SceneWallBox } from "../lib/buildScene";
import { finishRepeat } from "../lib/finishRepeat";
import { wallBoxGeometry } from "../lib/wallGeometry";
import { WalkRig } from "./WalkRig";
import { WalkInterior } from "./WalkInterior";
import { WalkRenderQuality } from "./WalkRenderQuality";
import { ROOM_FINISH } from "../config/finishAtlas";
import { useFinishTextures } from "../lib/useFinishTextures";
import type { FinishTextures } from "../model/finish";
import {
  CAMERA_FAR_M,
  CAMERA_NEAR_M,
  CEILING_COLOR,
  DEVICE_PIXEL_RATIO_RANGE,
  FIXTURE_COLOR,
  FLOOR_LIFT_M,
  FLOOR_THICKNESS_M,
  OPEN_AIR_ROOM_LABELS,
  ORBIT_CAMERA,
  ORBIT_WALL_HEIGHT_M,
  SCENE_BACKGROUND,
  SCENE_LIGHT,
  WALL_COLOR,
  WALK_LIGHT,
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
  const map = useMemo(() => repeatedClone(wallpaper, finishRepeat("wallpaper", wall.length, wall.height)), [wallpaper, wall.length, wall.height]);
  const geometry = useMemo(() => wallBoxGeometry(wall.length, wall.height, wall.thickness), [wall.length, wall.height, wall.thickness]);
  useEffect(() => () => map.dispose(), [map]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={[wall.cx, wall.yCenter, wall.cz]} rotation={[0, -wall.angleY, 0]} castShadow receiveShadow>
      <meshStandardMaterial attach="material-0" color={WALL_COLOR} />
      <meshStandardMaterial attach="material-1" color={FINISH_TINT} map={map} />
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
          <mesh key={i} position={[w.cx, w.yCenter, w.cz]} rotation={[0, -w.angleY, 0]} castShadow receiveShadow>
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

function Floor({ slab, finish }: { slab: SceneFloorSlab; finish: FinishTextures }) {
  const shape = useMemo(() => floorShape(slab), [slab]);
  const kind = ROOM_FINISH[slab.label];
  const texture = finish[kind];
  const map = useMemo(() => texture ? repeatedClone(texture, finishRepeat(kind)) : null, [texture, kind]);
  useEffect(() => () => map?.dispose(), [map]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_LIFT_M, 0]} receiveShadow>
      <extrudeGeometry args={[shape, { depth: FLOOR_THICKNESS_M, bevelEnabled: false }]} />
      {/* 비동기 로드 후 map 없는 셰이더를 재사용하지 않도록 재질을 다시 만든다. */}
      <meshStandardMaterial key={map ? "textured" : "solid"} color={map ? FINISH_TINT : slab.color} map={map} />
    </mesh>
  );
}

function Floors({ floors, finish }: { floors: SceneFloorSlab[]; finish: FinishTextures }) {
  return (
    <group>
      {floors.map((slab) => <Floor key={slab.roomId} slab={slab} finish={finish} />)}
    </group>
  );
}

function Ceiling({ slab }: { slab: SceneFloorSlab }) {
  const shape = useMemo(() => floorShape(slab), [slab]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CEILING_HEIGHT_M, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={CEILING_COLOR} side={THREE.BackSide} />
    </mesh>
  );
}

function Fixtures({ fixtures }: { fixtures: SceneFixtureBox[] }) {
  return (
    <group>
      {fixtures.map((f, i) => (
        <mesh key={i} position={[f.cx, f.height / 2, f.cz]} castShadow receiveShadow>
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
  const light = mode === "walk" ? WALK_LIGHT : SCENE_LIGHT;

  // 둘러보기는 도면을 읽는 그림이라 톤매핑 없이 원색을 둔다 — 기본 ACES는 흰 마감재를 회색으로 누른다.
  // 1인칭은 천장·그림자·방 조명으로 실제 방처럼 보여야 하므로 톤매핑과 노출을 켠다
  return (
    <Canvas
      flat={mode === "orbit"}
      shadows={mode === "walk" ? "basic" : false}
      gl={{ toneMappingExposure: mode === "walk" ? WALK_LIGHT.exposure : 1 }}
      dpr={DEVICE_PIXEL_RATIO_RANGE}
      camera={{ fov: CAMERA_FOV, near: CAMERA_NEAR_M, far: CAMERA_FAR_M, position: [0, radius, radius] }}
      className="absolute inset-0"
    >
      <color attach="background" args={[SCENE_BACKGROUND[mode]]} />
      <ambientLight intensity={light.ambient} />
      <hemisphereLight args={["#ffffff", "#9ca3af", light.hemisphere]} />
      <directionalLight position={[3, CEILING_HEIGHT_M * 3, 5]} intensity={light.directional} />
      <Floors floors={scene.floors} finish={finish} />
      {mode === "walk" && scene.floors.filter((slab) => !OPEN_AIR_ROOM_LABELS.includes(slab.label)).map((slab) => <Ceiling key={slab.roomId} slab={slab} />)}
      <Walls walls={walls} wallpaper={finish.wallpaper} />
      <Fixtures fixtures={scene.fixtures} />
      {mode === "walk" && <WalkInterior scene={scene} />}
      {mode === "walk" && <WalkRenderQuality />}
      {mode === "orbit" ? <OrbitRig radius={radius} /> : <WalkRig rigRef={rigRef} moveRef={moveRef} lookRef={lookRef} collision={scene.collision} spawn={scene.spawn} />}
    </Canvas>
  );
}
