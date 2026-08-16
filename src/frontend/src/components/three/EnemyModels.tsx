import { useGameStore } from "@/game/store";
import type { Enemy, EnemyFace } from "@/game/types";
import { cubeCenter } from "./coords";

const DEADLY = "#e14b8a";
const SAFE = "#4cd964";
const PURPLE = "#a05ce0";
const FROZEN = "#9fd8ff";

/** The icy tint applied to a frozen enemy's material. */
function tint(enemy: Enemy, base: string): string {
  return enemy.frozenTimer > 0 ? FROZEN : base;
}

/** An egg that hatches into a purple chasing snake. */
function EggSnake({ enemy }: { enemy: Enemy }) {
  if (!enemy.hatched) {
    return (
      <group>
        <mesh castShadow>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshStandardMaterial
            color={tint(enemy, "#f3efe6")}
            roughness={0.5}
          />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
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
          position={[i * 0.18 - 0.27, Math.sin(i * 0.8) * 0.06, 0]}
          castShadow
        >
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={tint(enemy, PURPLE)} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.36, 0.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={tint(enemy, PURPLE)} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** A small crab-like creature crawling on a cube face. */
function Crawler({ enemy }: { enemy: Enemy }) {
  const offset: Record<EnemyFace, [number, number, number]> = {
    top: [0, 0.4, 0],
    north: [0, 0.2, 0.4],
    south: [0, 0.2, -0.4],
    east: [0.4, 0.2, 0],
    west: [-0.4, 0.2, 0],
  };
  const off = offset[enemy.face];
  return (
    <group position={off}>
      <mesh castShadow>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial color={tint(enemy, DEADLY)} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.18, -0.12, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#7a3fa8" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** A green creature that reverses cube colors (safe). */
function Undo({ enemy }: { enemy: Enemy }) {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial color={tint(enemy, SAFE)} roughness={0.5} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.14, -0.2, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color={tint(enemy, "#2f9e44")}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/** A falling ball: red (deadly) or green (freezes enemies). */
function FallingBall({ enemy }: { enemy: Enemy }) {
  const color = enemy.color === "safe" ? SAFE : DEADLY;
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.22, 20, 20]} />
      <meshStandardMaterial color={tint(enemy, color)} roughness={0.4} />
    </mesh>
  );
}

/** A modern chasing drone with spinning propellers. */
function Drone({ enemy }: { enemy: Enemy }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[0.34, 0.12, 0.34]} />
        <meshStandardMaterial color={tint(enemy, "#3a3a5c")} roughness={0.4} />
      </mesh>
      {[
        [-0.24, -0.24],
        [0.24, -0.24],
        [-0.24, 0.24],
        [0.24, 0.24],
      ].map(([x, z]) => (
        <group key={`prop-${x}-${z}`} position={[x, 0.16, z]}>
          <mesh>
            <boxGeometry args={[0.2, 0.02, 0.06]} />
            <meshStandardMaterial
              color={tint(enemy, "#e14b8a")}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A squishy color-draining blob. */
function Blob({ enemy }: { enemy: Enemy }) {
  return (
    <group>
      <mesh castShadow>
        <sphereGeometry args={[0.26, 20, 20]} />
        <meshStandardMaterial
          color={tint(enemy, "#7a3fa8")}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={tint(enemy, "#a05ce0")} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Render every enemy on the board with a distinct readable silhouette. */
export function EnemyModels() {
  const enemies = useGameStore((s) => s.enemies);
  const board = useGameStore((s) => s.board);

  return (
    <group>
      {enemies.map((enemy) => {
        const pos = cubeCenter(board, enemy.position);
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
