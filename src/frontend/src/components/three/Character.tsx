import { useGameStore } from "@/game/store";
import type { Board, PlayerState } from "@/game/types";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { cubeCenter } from "./coords";

const ORANGE = "#ff8c42";
const DARK_ORANGE = "#e06a1f";
const BELLY = "#ffd9a8";
const NOSE = "#ff6b3d";

/** A single big eye: white sclera with a dark pupil. */
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

/** The cute two-legged orange creature with a big nose. */
function CharacterBody({ scale }: { scale: [number, number, number] }) {
  return (
    <group scale={scale}>
      {/* legs */}
      <mesh position={[-0.16, -0.42, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={DARK_ORANGE} roughness={0.6} />
      </mesh>
      <mesh position={[0.16, -0.42, 0.05]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={DARK_ORANGE} roughness={0.6} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color={ORANGE} roughness={0.5} />
      </mesh>
      {/* belly */}
      <mesh position={[0, -0.05, 0.18]}>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color={BELLY} roughness={0.6} />
      </mesh>
      {/* eyes */}
      <Eye side={-1} />
      <Eye side={1} />
      {/* big nose */}
      <mesh position={[0, -0.02, 0.34]}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color={NOSE} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Ghost spheres trailing behind the character during a hop. */
function Trail({ player, board }: { player: PlayerState; board: Board }) {
  if (!player.hopping) return null;
  const from = cubeCenter(board, player.hopFrom);
  const to = cubeCenter(board, player.hopTo);
  const t = player.hopProgress;
  const ghosts = [0.1, 0.2, 0.3].map((offset) => {
    const gt = Math.max(0, t - offset);
    const arc = Math.sin(gt * Math.PI) * 0.6;
    return {
      offset,
      pos: [
        from[0] + (to[0] - from[0]) * gt,
        from[1] + (to[1] - from[1]) * gt + arc,
        from[2] + (to[2] - from[2]) * gt,
      ] as [number, number, number],
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

/** The player character, animated by the store's player state. */
export function Character() {
  const player = useGameStore((s) => s.player);
  const board = useGameStore((s) => s.board);
  const bounceRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = bounceRef.current;
    if (!g) return;
    if (!player.hopping && !player.falling && !player.ridingDisc) {
      g.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 4)) * 0.04;
    } else {
      g.position.y = 0;
    }
  });

  let pos: [number, number, number];
  let scale: [number, number, number] = [1, 1, 1];

  if (player.hopping) {
    const from = cubeCenter(board, player.hopFrom);
    const to = cubeCenter(board, player.hopTo);
    const t = player.hopProgress;
    const arc = Math.sin(t * Math.PI) * 0.6;
    pos = [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t + arc,
      from[2] + (to[2] - from[2]) * t,
    ];
    const stretch = 1 + Math.sin(t * Math.PI) * 0.25;
    const squash = 1 - Math.sin(t * Math.PI) * 0.15;
    scale = [squash, stretch, squash];
  } else if (player.falling) {
    const base = cubeCenter(board, player.position);
    pos = [base[0], base[1] - player.fallProgress * 3, base[2]];
    scale = [1.1, 0.8, 1.1];
  } else if (player.ridingDisc) {
    const base = cubeCenter(board, player.position);
    pos = [base[0], base[1] + player.rideTimer * 1.5, base[2]];
  } else {
    pos = cubeCenter(board, player.position);
  }

  return (
    <group>
      <Trail player={player} board={board} />
      <group position={pos}>
        <group ref={bounceRef} rotation={[0, -Math.PI / 4, 0]}>
          <CharacterBody scale={scale} />
        </group>
      </group>
    </group>
  );
}
