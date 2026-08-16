import { useGameStore } from "@/game/store";
import type { Cube } from "@/game/types";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { CUBE_SIZE, colorFor, cubeCenter } from "./coords";

/** A glowing ring or arrow overlay for special cubes. */
function SpecialOverlay({ cube }: { cube: Cube }) {
  if (cube.special === "teleporter") {
    return (
      <group position={[0, CUBE_SIZE / 2 + 0.03, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.28, 0.05, 12, 28]} />
          <meshStandardMaterial
            color="#a05ce0"
            emissive="#a05ce0"
            emissiveIntensity={1.4}
            roughness={0.3}
          />
        </mesh>
      </group>
    );
  }
  if (cube.special === "booster") {
    return (
      <group position={[0, CUBE_SIZE / 2 + 0.03, 0]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.18, 0.3, 4]} />
          <meshStandardMaterial
            color="#30d5c8"
            emissive="#30d5c8"
            emissiveIntensity={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>
    );
  }
  return null;
}

/** A single matte-plastic cube with smooth color transitions. */
function CubeMesh({
  cube,
  position,
}: {
  cube: Cube;
  position: [number, number, number];
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const target = useRef(new THREE.Color(colorFor(cube.color)));
  target.current.set(colorFor(cube.color));

  useFrame(() => {
    const mat = matRef.current;
    if (!mat) return;
    if (cube.special === "multi") {
      // Multi cubes cycle their hue over time.
      const hue = (cube.cycleIndex * 0.12) % 1;
      mat.color.setHSL(hue, 0.65, 0.55);
      return;
    }
    mat.color.lerp(target.current, 0.12);
  });

  const isIce = cube.special === "ice";
  const isSticky = cube.special === "sticky";

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        <meshStandardMaterial
          ref={matRef}
          color={colorFor(cube.color)}
          roughness={isSticky ? 0.2 : 0.55}
          metalness={isSticky ? 0.3 : 0.05}
          transparent={isIce}
          opacity={isIce ? 0.55 : 1}
        />
      </mesh>
      <SpecialOverlay cube={cube} />
    </group>
  );
}

/** Render the full pyramid board from the store's `board` field. */
export function Pyramid() {
  const board = useGameStore((s) => s.board);
  const cubes = Object.values(board.cubes);

  return (
    <group>
      {cubes.map((cube) => (
        <CubeMesh
          key={`${cube.position.x},${cube.position.z},${cube.position.y}`}
          cube={cube}
          position={cubeCenter(board, cube.position)}
        />
      ))}
    </group>
  );
}
