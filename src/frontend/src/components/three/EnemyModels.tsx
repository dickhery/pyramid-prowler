import { useGameStore } from "@/game/store";
import type { Enemy, EnemyFace } from "@/game/types";
import { CUBE_SIZE, hopArc, hopWorldDelta, standOnTop } from "./coords";

const DEADLY = "#e14b8a";
const SAFE = "#4cd964";
const PURPLE = "#7a3fa8";
const FROZEN = "#9fd8ff";

function tint(enemy: Enemy, base: string): string {
  return enemy.frozenTimer > 0 ? FROZEN : base;
}

function EggSnake({ enemy }: { enemy: Enemy }) {
  if (!enemy.hatched) {
    return (
      <group>
        <mesh castShadow>
          <sphereGeometry args={[0.26, 20, 20]} />
          <meshStandardMaterial
            color={tint(enemy, "#c9b6e8")}
            roughness={0.45}
          />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color={tint(enemy, "#e8e2d4")}
            roughness={0.5}
          />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <mesh
          key={i}
          position={[i * 0.16 - 0.24, Math.sin(i * 0.8) * 0.05, 0]}
          castShadow
        >
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={tint(enemy, PURPLE)} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.34, 0.06, 0.04]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={tint(enemy, PURPLE)} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.4, 0.12, s * 0.08]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function Crawler({ enemy }: { enemy: Enemy }) {
  const offset: Record<EnemyFace, [number, number, number]> = {
    top: [0, 0, 0],
    north: [0, -0.15, CUBE_SIZE * 0.42],
    south: [0, -0.15, -CUBE_SIZE * 0.42],
    east: [CUBE_SIZE * 0.42, -0.15, 0],
    west: [-CUBE_SIZE * 0.42, -0.15, 0],
  };
  const off = offset[enemy.face];
  return (
    <group position={off}>
      <mesh castShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={tint(enemy, DEADLY)} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.16, -0.08, 0.08]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#7a3fa8" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Undo({ enemy }: { enemy: Enemy }) {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial color={tint(enemy, SAFE)} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, -0.16, 0.04]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial
            color={tint(enemy, "#2f9e44")}
            roughness={0.6}
          />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`eye-${s}`} position={[s * 0.07, 0.06, 0.16]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function FallingBall({ enemy }: { enemy: Enemy }) {
  const color = enemy.color === "safe" ? SAFE : "#e24b4b";
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.2, 20, 20]} />
      <meshStandardMaterial color={tint(enemy, color)} roughness={0.35} />
    </mesh>
  );
}

function Drone({ enemy }: { enemy: Enemy }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color={tint(enemy, "#3a3a5c")} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Blob({ enemy }: { enemy: Enemy }) {
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.22, 20, 20]} />
      <meshStandardMaterial color={tint(enemy, "#7a3fa8")} roughness={0.3} />
    </mesh>
  );
}

function enemyWorldPos(
  enemy: Enemy,
  board: ReturnType<typeof useGameStore.getState>["board"],
): [number, number, number] {
  const standOffset = enemy.kind === "crawler" ? 0.12 : 0;
  const lift = (pos: typeof enemy.position): [number, number, number] => {
    const [x, y, z] = standOnTop(board, pos);
    return [x, y - standOffset, z];
  };

  if (enemy.falling) {
    const base = lift(enemy.position);
    return [base[0], base[1] - enemy.fallProgress * 6, base[2]];
  }
  if (enemy.hopping) {
    if (enemy.leaving) {
      const from = lift(enemy.hopFrom);
      const dir = enemy.crawlSense === "right" ? "north" : "south";
      const [dx, , dz] = hopWorldDelta(dir);
      const t = enemy.hopProgress;
      return hopArc(from, [from[0] + dx, from[1] - 1.2, from[2] + dz], t, 0.5);
    }
    return hopArc(
      lift(enemy.hopFrom),
      lift(enemy.hopTo),
      enemy.hopProgress,
      0.7,
    );
  }
  return lift(enemy.position);
}

export function EnemyModels() {
  const enemies = useGameStore((s) => s.enemies);
  const board = useGameStore((s) => s.board);

  return (
    <group>
      {enemies.map((enemy) => {
        const pos = enemyWorldPos(enemy, board);
        let model: React.ReactNode;
        switch (enemy.kind) {
          case "eggSnake":
            model = <EggSnake enemy={enemy} />;
            break;
          case "crawler":
            model = <Crawler enemy={enemy} />;
            break;
          case "undo":
            model = <Undo enemy={enemy} />;
            break;
          case "fallingBall":
            model = <FallingBall enemy={enemy} />;
            break;
          case "drone":
            model = <Drone enemy={enemy} />;
            break;
          case "blob":
            model = <Blob enemy={enemy} />;
            break;
        }
        return (
          <group key={enemy.id} position={pos}>
            {model}
          </group>
        );
      })}
    </group>
  );
}
