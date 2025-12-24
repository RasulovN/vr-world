import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FloatingCube = ({ position, color, size }: { position: [number, number, number]; color: string; size: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const offset = Math.random() * Math.PI * 2;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5 + offset;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 + offset;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + offset) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const NeonPillar = ({ position }: { position: [number, number, number] }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <cylinderGeometry args={[0.1, 0.1, 8, 8]} />
        <meshStandardMaterial
          color="#00f5ff"
          emissive="#00f5ff"
          emissiveIntensity={0.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <pointLight color="#00f5ff" intensity={1} distance={10} position={[0, 4, 0]} />
    </group>
  );
};

const GlowOrb = ({ position, color }: { position: [number, number, number]; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2}
        transparent
        opacity={0.8}
      />
      <pointLight color={color} intensity={2} distance={8} />
    </mesh>
  );
};

export const Environment = () => {
  return (
    <group>
      {/* Floating cubes */}
      <FloatingCube position={[-15, 5, -20]} color="#ff00ff" size={2} />
      <FloatingCube position={[20, 8, -15]} color="#00f5ff" size={1.5} />
      <FloatingCube position={[-25, 6, 10]} color="#ff3366" size={1.8} />
      <FloatingCube position={[15, 4, 25]} color="#00ff88" size={1.2} />

      {/* Neon pillars */}
      <NeonPillar position={[-10, 4, -10]} />
      <NeonPillar position={[10, 4, -10]} />
      <NeonPillar position={[-10, 4, 10]} />
      <NeonPillar position={[10, 4, 10]} />

      {/* Glow orbs */}
      <GlowOrb position={[5, 3, -5]} color="#ff00ff" />
      <GlowOrb position={[-5, 4, 5]} color="#00f5ff" />
      <GlowOrb position={[0, 5, -15]} color="#ff3366" />

      {/* Ambient particles */}
      {Array.from({ length: 50 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 80,
            Math.random() * 10 + 2,
            (Math.random() - 0.5) * 80,
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color="#00f5ff"
            emissive="#00f5ff"
            emissiveIntensity={3}
          />
        </mesh>
      ))}
    </group>
  );
};
