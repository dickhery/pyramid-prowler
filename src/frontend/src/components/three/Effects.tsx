import { useGameStore } from "@/game/store";
import type { Board, Particle } from "@/game/types";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { cubeTop } from "./coords";

function ParticleMesh({
  particle,
  board,
}: {
  particle: Particle;
  board: Board;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const base = cubeTop(board, particle.position);
  const t = 1 - particle.life / particle.maxLife;

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    mesh.position.set(base[0], base[1] + 0.2 + t * 1.1, base[2]);
    const fade = Math.max(0, particle.life / particle.maxLife);
    const mat = mesh.material as THREE.MeshStandardMaterial;
    mat.opacity = fade;
    mesh.scale.setScalar(0.12 + t * 0.2);
  });

  return (
    <mesh ref={ref} position={[base[0], base[1] + 0.2, base[2]]}>
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

export function ScreenShake() {
  const shake = useGameStore((s) => s.shake);

  useFrame((state) => {
    if (shake <= 0) return;
    const intensity = shake * 0.22;
    const t = state.clock.elapsedTime * 58;
    state.camera.position.x += Math.sin(t) * intensity;
    state.camera.position.y += Math.cos(t * 1.3) * intensity;
  });

  return null;
}
