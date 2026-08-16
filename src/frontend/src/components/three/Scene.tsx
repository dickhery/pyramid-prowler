import { useGameStore } from "@/game/store";
import type { DiscSpot } from "@/game/types";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Character } from "./Character";
import { Effects, ScreenShake } from "./Effects";
import { EnemyModels } from "./EnemyModels";
import { Pyramid } from "./Pyramid";
import { CUBE_SIZE, discWorldPos, pyramidFocus } from "./coords";

function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 2]}
      receiveShadow
    >
      <planeGeometry args={[48, 48]} />
      <meshStandardMaterial color="#12122a" roughness={1} metalness={0} />
    </mesh>
  );
}

function DiscMesh({ disc }: { disc: DiscSpot }) {
  const ref = useRef<THREE.Mesh>(null);
  const board = useGameStore((s) => s.board);
  const base = discWorldPos(board, disc);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    if (disc.active) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.position.set(base[0], base[1] + Math.sin(t * 2.2) * 0.07, base[2]);
    mesh.rotation.y = t * 1.1;
  });

  return (
    <group>
      <mesh ref={ref} position={base} castShadow rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.07, 24]} />
        <meshStandardMaterial
          color="#ff6bd6"
          emissive="#ff6bd6"
          emissiveIntensity={0.7}
          roughness={0.28}
          metalness={0.25}
        />
      </mesh>
    </group>
  );
}

function Collectibles() {
  const discSpots = useGameStore((s) => s.discSpots);
  return (
    <group>
      {discSpots
        .filter((d) => !d.used)
        .map((d) => (
          <DiscMesh key={d.id} disc={d} />
        ))}
    </group>
  );
}

function GameLoop() {
  const update = useGameStore((s) => s.update);
  useFrame((_, delta) => {
    update(Math.min(delta, 0.05));
  });
  return null;
}

function CameraRig() {
  const cameraMode = useGameStore((s) => s.cameraMode);
  const board = useGameStore((s) => s.board);
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const dest = useRef(new THREE.Vector3());

  useFrame(() => {
    if (cameraMode !== "isometric") return;
    const [fx, fy, fz] = pyramidFocus(board);
    target.current.set(fx, fy, fz);
    dest.current.set(fx + 8.2, fy + 9.4, fz + 8.2);
    camera.position.lerp(dest.current, 0.14);
    camera.lookAt(target.current);
  });
  return null;
}

export function Scene() {
  const cameraMode = useGameStore((s) => s.cameraMode);
  const height = useGameStore((s) => s.board.height);
  const [fx, fy, fz] = [
    0,
    height * CUBE_SIZE * 0.36,
    height * CUBE_SIZE * 0.18,
  ];

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [fx + 8.2, fy + 9.4, fz + 8.2],
        fov: 38,
        near: 0.1,
        far: 80,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(fx, fy, fz);
      }}
    >
      <color attach="background" args={["#14122c"]} />
      <ambientLight intensity={0.52} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.32} />
      <hemisphereLight args={["#7a88c8", "#1a1630", 0.28]} />

      <GameLoop />
      <CameraRig />
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
          minDistance={7}
          maxDistance={22}
          maxPolarAngle={Math.PI / 2.15}
          target={[fx, fy, fz]}
        />
      )}
    </Canvas>
  );
}
