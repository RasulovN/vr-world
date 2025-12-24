import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface SpawnedObjectData {
  id: string;
  assetId: string;
  position: THREE.Vector3;
}

const objectConfigs: Record<string, { color: string; geometry: 'box' | 'sphere' | 'cylinder' | 'cone'; scale: [number, number, number] }> = {
  'table_wood.glb': { color: '#8B4513', geometry: 'box', scale: [1.5, 0.1, 0.8] },
  'chair_modern.glb': { color: '#444444', geometry: 'box', scale: [0.5, 0.8, 0.5] },
  'car_sedan.glb': { color: '#ff3366', geometry: 'box', scale: [2, 0.8, 1] },
  'tree_oak.glb': { color: '#228B22', geometry: 'cone', scale: [0.8, 2, 0.8] },
  'lamp_floor.glb': { color: '#ffd700', geometry: 'cylinder', scale: [0.2, 1.5, 0.2] },
  'sphere_glow.glb': { color: '#00f5ff', geometry: 'sphere', scale: [0.5, 0.5, 0.5] },
};

interface SpawnedObjectProps {
  data: SpawnedObjectData;
}

export const SpawnedObject = ({ data }: SpawnedObjectProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const config = objectConfigs[data.assetId] || { color: '#888888', geometry: 'box', scale: [1, 1, 1] };

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = config.scale[1] / 2 + Math.sin(state.clock.elapsedTime * 2 + data.position.x) * 0.05;
    }
  });

  const renderGeometry = () => {
    switch (config.geometry) {
      case 'sphere':
        return <sphereGeometry args={[config.scale[0], 16, 16]} />;
      case 'cylinder':
        return <cylinderGeometry args={[config.scale[0], config.scale[0], config.scale[1], 16]} />;
      case 'cone':
        return <coneGeometry args={[config.scale[0], config.scale[1], 16]} />;
      default:
        return <boxGeometry args={config.scale} />;
    }
  };

  return (
    <group position={[data.position.x, 0, data.position.z]}>
      <mesh ref={meshRef}>
        {renderGeometry()}
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* Base glow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(...config.scale) * 0.8, 32]} />
        <meshStandardMaterial
          color="#00f5ff"
          emissive="#00f5ff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};
