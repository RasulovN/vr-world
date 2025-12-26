import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export interface SpawnedObjectData {
  id: string;
  assetId: string;
  position: THREE.Vector3;
}

type GeometryType = 'box' | 'sphere' | 'cylinder' | 'cone';

type ObjectConfig = {
  name: string;
  color: string;
  geometry: GeometryType;
  scale: [number, number, number];
  positionY?: number; // yerga to‘g‘ri qo‘nishi uchun
  rotationY?: number;
  material?: 'standard' | 'physical' | 'emissive';
  roughness?: number;
  metalness?: number;
  emissiveIntensity?: number;
   modelPath?: string; 
};

export const objectConfigs: Record<string, ObjectConfig> = {
  'table_wood.glb': {
    name: 'Wooden Table',
    color: '#8B5A2B',
    geometry: 'box',
    scale: [1.6, 0.12, 0.9],
    positionY: 0.6,
    material: 'standard',
    roughness: 0.8,
    metalness: 0.1,
  },

  'chair_modern.glb': {
    name: 'Modern Chair',
    color: '#3a3a3a',
    geometry: 'box',
    scale: [0.55, 0.9, 0.55],
    positionY: 0.45,
    material: 'standard',
    roughness: 0.6,
    metalness: 0.2,
  },

  'car_sedan.glb': {
    name: 'Sedan Car',
    color: '#ff3355',
    geometry: 'box',
    scale: [4.2, 1.4, 1.9],
    positionY: 0.7,
    material: 'physical',
    roughness: 0.3,
    metalness: 0.9,
  },

  'tree_oak.glb': {
    name: 'Oak Tree',
    color: '#2E8B57',
    geometry: 'cone',
    scale: [0.3, 0.3, 0.3],
    positionY: 0.5,
    material: 'standard',
    roughness: 1,
    metalness: 0,
    modelPath: '/models/tree_oak.glb',
  },
  'forset.glb': {
    name: 'Forset',
    color: '#2E8B57',
    geometry: 'cone',
    scale: [0.3, 0.3, 0.3],
    positionY: 0.5,
    material: 'standard',
    roughness: 1,
    metalness: 0,
    modelPath: '/models/forset.glb',
  },

  'lamp_floor.glb': {
    name: 'Floor Lamp',
    color: '#FFD700',
    geometry: 'cylinder',
    scale: [0.25, 2.2, 0.25],
    positionY: 1.1,
    material: 'emissive',
    emissiveIntensity: 1.5,
  },

  'sphere_glow.glb': {
    name: 'Energy Sphere',
    color: '#00F5FF',
    geometry: 'sphere',
    scale: [0.6, 0.6, 0.6],
    positionY: 0.6,
    material: 'emissive',
    emissiveIntensity: 2.5,
  },
  'city_scene.glb': {
    name: 'City Scene',
    color: '#888888',
    geometry: 'box',
    scale: [3, 1.5, 3],
    positionY: 0.75,
    material: 'standard',
    roughness: 0.7,
    metalness: 0.3,
    modelPath: '/models/city_scene.glb',
  },  
  'ak_47_pbr.glb': {
    name: 'AK-47',
    color: '#888888',
    geometry: 'box',
    scale: [0.01, 0.01, 0.01],
    positionY: 0.75,
    material: 'standard',
    roughness: 0.7,
    metalness: 0.3,
    modelPath: '/models/ak_47_pbr.glb',
  },  
  'cybr_truck.glb': {
    name: 'Cyber Truck',
    color: '#888888',
    geometry: 'box',
    scale: [0.2, 0.2, 0.2],
    positionY: 0.75,
    material: 'standard',
    roughness: 0.7,
    metalness: 0.3,
    modelPath: '/models/cybr_truck.glb',
  },  
  'buggati.glb': {
    name: 'Buggati Truck',
    color: '#888888',
    geometry: 'box',
     scale: [80, 80, 80],
    positionY: 0.7,
    material: 'standard',
    roughness: 0.3,
    metalness: 0.9,
    modelPath: '/models/buggati.glb',
  },  
};


interface SpawnedObjectProps {
  data: SpawnedObjectData;
}

export const SpawnedObject = ({ data }: SpawnedObjectProps) => {
  console.log('Rendering SpawnedObject:', data);
  const meshRef = useRef<THREE.Mesh>(null);
  const config = objectConfigs[data.assetId] || { color: '#888888', geometry: 'box', scale: [1, 1, 1], modelPath: undefined };
  const gltf = config.modelPath ? useGLTF(config.modelPath) : null;

  useFrame((state) => {
    if (meshRef.current && !gltf) {
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
    <group position={[data.position.x, config.positionY || 0, data.position.z]}>
      {gltf ? (
        <primitive object={gltf.scene} scale={config.scale} />
      ) : (
        <>
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
        </>
      )}
    </group>
  );
};
