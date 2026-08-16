import { useGameStore } from "@/game/store";
import type { Board, Particle } from "@/game/types";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { cubeCenter } from "./coords";

/** A single rising, fading particle burst. */
function ParticleMesh({
  particle,
  board,
}: {
  particle: Particle;
  board: Board;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const base = cubeCenter(board, particle.position);
  const t = 1 - particle.life / particle.maxLife;

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rise = t * 1.2;
    mesh.position.set(base[0], base[1] + rise, base[2]);
    const fade = Math.max(0, particle.life / particle.maxLife);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.opacity = fade;
    const grow = 0.12 + t * 0.18;
    mesh.scale.setScalar(grow);
  });

  return (
    <mesh ref={ref} position={base}>
      <sphereGeometry args={[0.14, 12, 12]} />
      <meshStandardMaterial
        color={particle.color}
        emissive={particle.color}
        emissiveIntensity={1.6}
        transparent
        opacity={1}
        roughness={0.3}
      />
    </mesh>
  );
}

/** Render every queued particle as a rising, fading burst. */
export function Effects() {
  const particles = useGameStore((s) => s.particles);
  const board = useGameStore((s) => s.board);

  return (
    <group>
      {particles.map((p) => (
        <ParticleMesh key={p.id} particle={p} board={board} />
      ))}
    </group>
  );
}

/** Apply a decaying screen shake to the camera based on the store's shake field. */
export function ScreenShake() {
  const shake = useGameStore((s) => s.shake);
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    if (shake <= 0) {
      g.position.set(0, 0, 0);
      return;
    }
    const intensity = shake * 0.35;
    const t = state.clock.elapsedTime * 60;
    g.position.set(Math.sin(t) * intensity, Math.cos(t * 1.3) * intensity, 0);
  });

  return <group ref={ref} />;
}
