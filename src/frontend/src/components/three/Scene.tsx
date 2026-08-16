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
import { discWorldPos, pyramidCameraPos, pyramidFocus } from "./coords";

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
  const ready = useRef(false);
  const lastKey = useRef(`${board.height}-${board.shape}`);

  useFrame(() => {
    const key = `${board.height}-${board.shape}`;
    if (lastKey.current !== key) {
      lastKey.current = key;
      ready.current = false;
    }
    const [fx, fy, fz] = pyramidFocus(board);
    const [px, py, pz] = pyramidCameraPos(board);
    target.current.set(fx, fy, fz);
    dest.current.set(px, py, pz);
    if (cameraMode !== "isometric") {
      ready.current = false;
      return;
    }
    if (!ready.current) {
      camera.position.set(px, py, pz);
      camera.lookAt(target.current);
      ready.current = true;
      return;
    }
    camera.position.lerp(dest.current, 0.12);
    camera.lookAt(target.current);
  });
  return null;
}

export function Scene() {
  const cameraMode = useGameStore((s) => s.cameraMode);
  const board = useGameStore((s) => s.board);
  const [fx, fy, fz] = pyramidFocus(board);
  const [px, py, pz] = pyramidCameraPos(board);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{
        position: [px, py, pz],
        fov: 34,
        near: 0.1,
        far: 90,
      }}
      onCreated={({ camera }) => {
        camera.lookAt(fx, fy, fz);
      }}
    >
      <color attach="background" args={["#121028"]} />
      <fog attach="fog" args={["#121028", 22, 48]} />
      <ambientLight intensity={0.62} />
      <directionalLight
        position={[4, 16, 10]}
        intensity={1.35}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <directionalLight position={[-8, 6, 4]} intensity={0.4} />
      <hemisphereLight args={["#9aa6e0", "#1a1630", 0.34]} />

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
