import { CEILING_HEIGHT_M } from "@/entities/floorplan";
import type { BuiltScene, SceneWallBox } from "../lib/buildScene";
import { FLOOR_LIFT_M, OPEN_AIR_ROOM_LABELS, WALK_LIGHT, WALK_TRIM } from "../config/constants";

function TrimBox({ box }: { box: SceneWallBox }) {
  return (
    <mesh position={[box.cx, box.yCenter, box.cz]} rotation={[0, -box.angleY, 0]}>
      <boxGeometry args={[box.length, box.height, box.thickness]} />
      <meshStandardMaterial color={WALK_TRIM.color} roughness={0.8} />
    </mesh>
  );
}

export function WalkInterior({ scene }: { scene: BuiltScene }) {
  return (
    <group>
      {scene.walls.filter((wall) => Math.abs(wall.yCenter - wall.height / 2) < FLOOR_LIFT_M).map((wall, index) => (
        <TrimBox key={`base-${index}`} box={{ ...wall, height: WALK_TRIM.heightM, yCenter: WALK_TRIM.heightM / 2 + FLOOR_LIFT_M, thickness: wall.thickness + WALK_TRIM.depthM * 2 }} />
      ))}
      {scene.doorFrames.map((box, index) => <TrimBox key={`door-${index}`} box={box} />)}
      {scene.floors.filter((floor) => !OPEN_AIR_ROOM_LABELS.includes(floor.label)).map((floor) => (
        <pointLight
          key={floor.roomId}
          position={[floor.center.x, CEILING_HEIGHT_M - WALK_LIGHT.ceilingOffsetM, floor.center.z]}
          intensity={WALK_LIGHT.roomIntensity}
          distance={WALK_LIGHT.distanceM}
          decay={2}
          castShadow
          shadow-mapSize-width={WALK_LIGHT.shadowMapSize}
          shadow-mapSize-height={WALK_LIGHT.shadowMapSize}
          shadow-autoUpdate={false}
          shadow-needsUpdate
        />
      ))}
    </group>
  );
}
