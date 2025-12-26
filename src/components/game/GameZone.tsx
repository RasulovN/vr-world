import { usePlane, useBox } from '@react-three/cannon';
import * as THREE from 'three';

interface GameZoneProps {
  setCanEnter: (can: boolean) => void;
  setCanExit: (can: boolean) => void;
}

export const GameZone = ({ setCanEnter, setCanExit }: GameZoneProps) => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 100], // Yer dan ancha masofada joylashgan
    type: 'Static',
  }));

  // Physics bodies for walls
  const [frontWallRef] = useBox(() => ({
    position: [0, 5, 250],
    args: [200, 10, 1],
    type: 'Static',
  }));

  const [backWallRef] = useBox(() => ({
    position: [0, 5, 50],
    args: [200, 10, 1],
    type: 'Static',
  }));

  const [leftWallRef] = useBox(() => ({
    position: [-100, 5, 100],
    args: [1, 10, 200],
    type: 'Static',
  }));

  const [rightWallRef] = useBox(() => ({
    position: [100, 5, 100],
    args: [1, 10, 200],
    type: 'Static',
  }));

  // Entrance trigger (sensor collider)
  const [entranceTriggerRef] = useBox(() => ({
    position: [0, 1, 49], // Just outside the back wall
    args: [10, 5, 2], // Small trigger area
    type: 'Static',
    isTrigger: true,
    onCollideBegin: () => setCanEnter(true),
    onCollideEnd: () => setCanEnter(false),
  }));

  // Exit trigger (sensor collider)
  const [exitTriggerRef] = useBox(() => ({
    position: [0, 1, 251], // Just outside the front wall
    args: [10, 5, 2], // Small trigger area
    type: 'Static',
    isTrigger: true,
    onCollideBegin: () => setCanExit(true),
    onCollideEnd: () => setCanExit(false),
  }));

  return (
    <group>
      {/* Game Zone Ground */}
      <mesh ref={ref as any} receiveShadow castShadow>
        {/* ARENA SIZE */}
        <planeGeometry args={[200, 200]} />

        {/* SHOOTER-STYLE MATERIAL - Simple green color */}
        <meshStandardMaterial
          roughness={0.8}
          metalness={0.1}
          color="#22c55e" // Simple green color
          transparent={false}
          alphaTest={0}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>

      {/* Glass-like boundaries around GameZone */}
      {/* Front Wall */}
      <mesh ref={frontWallRef as any} receiveShadow>
        <boxGeometry args={[200, 10, 1]} />
        <meshStandardMaterial
          color="#58c8db"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Back Wall */}
      <mesh ref={backWallRef as any} receiveShadow>
        <boxGeometry args={[200, 10, 1]} />
        <meshStandardMaterial
          color="#17a9e8"
          transparent
          opacity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Left Wall */}
      <mesh ref={leftWallRef as any} receiveShadow>
        <boxGeometry args={[1, 10, 200]} />
        <meshStandardMaterial
          color="#00cfcf"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Right Wall */}
      <mesh ref={rightWallRef as any} receiveShadow>
        <boxGeometry args={[1, 10, 200]} />
        <meshStandardMaterial
          color="#0ba3a3"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Entrance Trigger Visual Indicator */}
      <mesh position={[0, 1, 49]}>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial
          color="#00ff00"
          transparent
          opacity={0.3}
          emissive="#00ff00"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Exit Trigger Visual Indicator */}
      <mesh position={[0, 1, 251]}>
        <boxGeometry args={[10, 5, 0.1]} />
        <meshStandardMaterial
          color="#ff0000"
          transparent
          opacity={0.3}
          emissive="#ff0000"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Corner Pillars for Arena feel */}
      <mesh position={[-90, 8, 60]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#e30b0b" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh position={[90, 8, 60]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#ff0f0f" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh position={[-90, 8, 240]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#ff0f0f" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh position={[90, 8, 240]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#ff0f0f" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
};
