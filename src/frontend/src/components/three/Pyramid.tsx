import { directionBetween } from "@/game/board";
import { useGameStore } from "@/game/store";
import type { Cube } from "@/game/types";
import { useMemo } from "react";
import * as THREE from "three";
import { CUBE_SIZE, cubeCenter, topColor } from "./coords";

function CubeMesh({
  cube,
  position,
  top,
  sideA,
  sideB,
  colorBlind,
  clickable,
  onHop,
}: {
  cube: Cube;
  position: [number, number, number];
  top: string;
  sideA: string;
  sideB: string;
  colorBlind: boolean;
  clickable: boolean;
  onHop: () => void;
}) {
  const materials = useMemo(() => {
    const make = (
      color: string,
      extra?: Partial<THREE.MeshStandardMaterialParameters>,
    ) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.48,
        metalness: 0.06,
        ...extra,
      });
    // Box faces: +x, -x, +y, -y, +z, -z
    // Camera sits in +X+Y+Z, so +Z is the left isometric face and +X is the right.
    return [
      make(sideB),
      make(sideB),
      make(top),
      make("#1a1630"),
      make(sideA),
      make(sideA),
    ];
  }, [top, sideA, sideB]);

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        material={materials}
        onPointerDown={(event) => {
          if (!clickable) return;
          if (event.pointerType === "touch") return;
          event.stopPropagation();
          onHop();
        }}
        onPointerOver={(event) => {
          if (!clickable) return;
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry
          args={[CUBE_SIZE * 0.98, CUBE_SIZE * 0.98, CUBE_SIZE * 0.98]}
        />
      </mesh>
      {colorBlind && (
        <mesh
          position={[0, CUBE_SIZE / 2 + 0.012, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry
            args={
              cube.painted
                ? [0.12, 0.28, 4]
                : cube.paintProgress === 1
                  ? [0.18, 0.26, 16]
                  : [0.04, 0.22, 16]
            }
          />
          <meshBasicMaterial color={cube.painted ? "#ffffff" : "#1a1a2e"} />
        </mesh>
      )}
    </group>
  );
}

export function Pyramid() {
  const board = useGameStore((s) => s.board);
  const level = useGameStore((s) => s.level);
  const colorBlind = useGameStore((s) => s.colorBlind);
  const player = useGameStore((s) => s.player);
  const hop = useGameStore((s) => s.hop);
  const cubes = Object.values(board.cubes);

  return (
    <group>
      {cubes.map((cube) => {
        const dir = directionBetween(player.position, cube.position);
        return (
          <CubeMesh
            key={`${cube.position.x},${cube.position.z},${cube.position.y}`}
            cube={cube}
            position={cubeCenter(board, cube.position)}
            top={topColor(cube, level)}
            sideA={level.sideAHex}
            sideB={level.sideBHex}
            colorBlind={colorBlind}
            clickable={Boolean(dir) && !player.hopping && !player.stunned}
            onHop={() => {
              if (dir) hop(dir);
            }}
          />
        );
      })}
    </group>
  );
}
