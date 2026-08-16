import { useGameStore } from "@/game/store";
import type { Board, PlayerState } from "@/game/types";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { discWorldPos, hopArc, hopWorldDelta, standOnTop } from "./coords";

const ORANGE = "#ff8c42";
const DARK_ORANGE = "#e06a1f";
const BELLY = "#ffd9a8";
const NOSE = "#ff6b3d";

function Eye({ side }: { side: number }) {
  return (
    <group position={[side * 0.16, 0.14, 0.3]}>
      <mesh>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.06]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.2} />
      </mesh>
    </group>
  );
}

function CharacterBody({ scale }: { scale: [number, number, number] }) {
  return (
    <group scale={scale}>
      <mesh position={[-0.16, -0.42, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={DARK_ORANGE} roughness={0.6} />
      </mesh>
      <mesh position={[0.16, -0.42, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={DARK_ORANGE} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color={ORANGE} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.05, 0.18]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color={BELLY} roughness={0.6} />
      </mesh>
      <Eye side={-1} />
      <Eye side={1} />
      <mesh position={[0, -0.02, 0.34]}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color={NOSE} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Trail({ player, board }: { player: PlayerState; board: Board }) {
  if (!player.hopping) return null;
  const from = standOnTop(board, player.hopFrom);
  const to = standOnTop(board, player.hopTo);
  const t = player.hopProgress;
  const ghosts = [0.12, 0.24, 0.36].map((offset) => {
    const gt = Math.max(0, t - offset);
    return {
      offset,
      pos: hopArc(from, to, gt, 0.9),
    };
  });
  return (
    <group>
      {ghosts.map(({ offset, pos }, i) => (
        <mesh key={`ghost-${offset}`} position={pos}>
          <sphereGeometry args={[0.12 - i * 0.03, 12, 12]} />
          <meshStandardMaterial
            color={ORANGE}
            transparent
            opacity={0.4 - i * 0.12}
          />
        </mesh>
      ))}
    </group>
  );
}

function playerWorldPos(
  player: PlayerState,
  board: Board,
  discs: ReturnType<typeof useGameStore.getState>["discSpots"],
): [number, number, number] {
  if (player.hopping) {
    return hopArc(
      standOnTop(board, player.hopFrom),
      standOnTop(board, player.hopTo),
      player.hopProgress,
      0.9,
    );
  }
  if (player.falling) {
    const base = standOnTop(board, player.position);
    const dir = player.fallDirection ?? "south";
    const [dx, , dz] = hopWorldDelta(dir);
    const t = player.fallProgress;
    return [
      base[0] + dx * 0.7 * Math.min(1, t * 2),
      base[1] - t * t * 7,
      base[2] + dz * 0.7 * Math.min(1, t * 2),
    ];
  }
  if (player.ridingDisc) {
    const disc = discs.find((d) => d.active);
    const from = disc
      ? discWorldPos(board, disc)
      : standOnTop(board, player.position);
    const to = standOnTop(board, {
      x: 0,
      z: 0,
      y: board.height - 1,
    });
    const t = 1 - player.rideTimer / 1.15;
    const [x, y, z] = hopArc(from, to, Math.min(1, Math.max(0, t)), 2.1);
    return [x, y + 0.15, z];
  }
  return standOnTop(board, player.position);
}

export function Character() {
  const player = useGameStore((s) => s.player);
  const board = useGameStore((s) => s.board);
  const discs = useGameStore((s) => s.discSpots);
  const bounceRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = bounceRef.current;
    if (!g) return;
    const parent = g.parent;
    if (parent) {
      const dx = state.camera.position.x - parent.position.x;
      const dz = state.camera.position.z - parent.position.z;
      if (dx * dx + dz * dz > 0.0001) {
        g.rotation.y = Math.atan2(dx, dz);
      }
    }
    if (!player.hopping && !player.falling && !player.ridingDisc) {
      g.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 4)) * 0.04;
    } else {
      g.position.y = 0;
    }
  });

  let scale: [number, number, number] = [1, 1, 1];
  if (player.hopping) {
    const stretch = 1 + Math.sin(player.hopProgress * Math.PI) * 0.22;
    const squash = 1 - Math.sin(player.hopProgress * Math.PI) * 0.12;
    scale = [squash, stretch, squash];
  } else if (player.falling) {
    scale = [1.12, 0.78, 1.12];
  }

  const pos = playerWorldPos(player, board, discs);
  const showSwear = player.swearTimer > 0;

  return (
    <group>
      <Trail player={player} board={board} />
      <group position={pos}>
        <group ref={bounceRef}>
          <CharacterBody scale={scale} />
          {showSwear && (
            <Html position={[0.15, 0.72, 0.2]} center distanceFactor={8}>
              <div className="rounded-xl bg-card/95 px-2 py-1 font-mono text-sm font-black text-foreground shadow-plastic-sm">
                @!#?@!
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
}
