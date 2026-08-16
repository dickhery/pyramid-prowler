import { useGameStore } from "@/game/store";
import type { DiscSpot, Gem, PowerUp } from "@/game/types";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { Character } from "./Character";
import { Effects, ScreenShake } from "./Effects";
import { EnemyModels } from "./EnemyModels";
import { Pyramid } from "./Pyramid";
import { cubeCenter } from "./coords";

/** A soft ground plane that catches shadows. */
function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
    >
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#14142e" roughness={1} metalness={0} />
    </mesh>
  );
}

/** A collectible gem that sparkles and bobs above its cube. */
function GemMesh({ gem }: { gem: Gem }) {
  const ref = useRef<THREE.Mesh>(null);
  const board = useGameStore((s) => s.board);
  const base = cubeCenter(board, gem.position);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    mesh.position.set(base[0], base[1] + 0.5 + Math.sin(t * 3) * 0.12, base[2]);
    mesh.rotation.y = t * 1.5;
    mesh.rotation.x = Math.sin(t * 2) * 0.3;
  });

  return (
    <mesh ref={ref} position={[base[0], base[1] + 0.5, base[2]]} castShadow>
      <octahedronGeometry args={[0.18, 0]} />
      <meshStandardMaterial
        color="#ffd54a"
        emissive="#ffd54a"
        emissiveIntensity={1.2}
        roughness={0.2}
        metalness={0.4}
      />
    </mesh>
  );
}

/** A collectible power-up floating above its cube. */
function PowerUpMesh({ powerUp }: { powerUp: PowerUp }) {
  const ref = useRef<THREE.Mesh>(null);
  const board = useGameStore((s) => s.board);
  const base = cubeCenter(board, powerUp.position);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    mesh.position.set(
      base[0],
      base[1] + 0.55 + Math.sin(t * 2.5) * 0.1,
      base[2],
    );
    mesh.rotation.y = t * 1.2;
  });

  return (
    <mesh ref={ref} position={[base[0], base[1] + 0.55, base[2]]} castShadow>
      <icosahedronGeometry args={[0.16, 0]} />
      <meshStandardMaterial
        color="#30d5c8"
        emissive="#30d5c8"
        emissiveIntensity={0.9}
        roughness={0.25}
        metalness={0.3}
      />
    </mesh>
  );
}

/** A floating disc that transports the player back to the top. */
function DiscMesh({ disc }: { disc: DiscSpot }) {
  const ref = useRef<THREE.Mesh>(null);
  const board = useGameStore((s) => s.board);
  const base = cubeCenter(board, disc.position);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    mesh.position.set(
      base[0],
      base[1] + 0.35 + Math.sin(t * 2) * 0.08,
      base[2],
    );
    mesh.rotation.z = t * 0.8;
  });

  return (
    <mesh ref={ref} position={[base[0], base[1] + 0.35, base[2]]} castShadow>
      <cylinderGeometry args={[0.34, 0.34, 0.06, 24]} />
      <meshStandardMaterial
        color="#30d5c8"
        emissive="#30d5c8"
        emissiveIntensity={0.8}
        roughness={0.3}
        metalness={0.2}
      />
    </mesh>
  );
}

/** The collectibles and discs floating above the pyramid. */
function Collectibles() {
  const gems = useGameStore((s) => s.gems);
  const powerUpItems = useGameStore((s) => s.powerUpItems);
  const discSpots = useGameStore((s) => s.discSpots);

  return (
    <group>
      {gems
        .filter((g) => !g.collected)
        .map((g) => (
          <GemMesh key={g.id} gem={g} />
        ))}
      {powerUpItems.map((p) => (
        <PowerUpMesh key={p.id} powerUp={p} />
      ))}
      {discSpots.map((d) => (
        <DiscMesh key={d.id} disc={d} />
      ))}
    </group>
  );
}

/** Drives the game loop: ticks the engine's update with the frame delta. */
function GameLoop() {
  const update = useGameStore((s) => s.update);
  useFrame((_, delta) => {
    update(Math.min(delta, 0.05));
  });
  return null;
}

/**
 * The primary 3D scene: an isometric camera by default with a toggleable
 * free-orbit camera, soft lighting, and the full pyramid world composed of
 * the board, character, enemies, collectibles, and effects.
 */
export function Scene() {
  const cameraMode = useGameStore((s) => s.cameraMode);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={
        cameraMode === "isometric"
          ? { position: [10, 12, 10], fov: 40, near: 0.1, far: 100 }
          : { position: [8, 6, 8], fov: 50, near: 0.1, far: 100 }
      }
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-6, 4, -6]} intensity={0.35} />

      <GameLoop />
      <ScreenShake />
      <Pyramid />
      <Character />
      <EnemyModels />
      <Collectibles />
      <Effects />
      <Ground />

      {cameraMode === "orbit" && (
        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2.2}
        />
      )}
    </Canvas>
  );
}
