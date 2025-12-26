import { usePlane } from '@react-three/cannon';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export const GameZone = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 100], // Yer dan ancha masofada joylashgan
    type: 'Static',
  }));

  const textures = useTexture({
    map: '/textures/image.png',
  });

  // texture takrorlanishi (katta arena uchun)
  textures.map.wrapS = textures.map.wrapT = THREE.RepeatWrapping;
  textures.map.repeat.set(20, 20); // Kamaytirdim takrorlanishni
  textures.map.minFilter = THREE.LinearMipmapLinearFilter;
  textures.map.magFilter = THREE.LinearFilter;
  textures.map.generateMipmaps = true;

  return (
    <group>
      {/* Game Zone Ground */}
      <mesh ref={ref as any} receiveShadow castShadow>
        {/* ARENA SIZE */}
        <planeGeometry args={[200, 200]} />

        {/* SHOOTER-STYLE MATERIAL - Flickering tuzatildi */}
        <meshStandardMaterial
          map={textures.map}
          roughness={0.8}
          metalness={0.1}
          color="#94a0b5"
          transparent={false}
          alphaTest={0}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>

      {/* Glass-like boundaries around GameZone */}
      {/* Front Wall */}
      <mesh position={[0, 5, 200]} receiveShadow>
        <boxGeometry args={[200, 10, 1]} />
        <meshStandardMaterial
          color="#00d4d4"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 5, 0]} receiveShadow>
        <boxGeometry args={[200, 10, 1]} />
        <meshStandardMaterial
          color="#00d4d4"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-100, 5, 100]} receiveShadow>
        <boxGeometry args={[1, 10, 200]} />
        <meshStandardMaterial
          color="#00d4d4"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Right Wall */}
      <mesh position={[100, 5, 100]} receiveShadow>
        <boxGeometry args={[1, 10, 200]} />
        <meshStandardMaterial
          color="#00d4d4"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>

      {/* Corner Pillars for Arena feel */}
      <mesh position={[-90, 8, 10]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#ff0000" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh position={[90, 8, 10]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#ff0000" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh position={[-90, 8, 190]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#ff0000" roughness={0.3} metalness={0.7} />
      </mesh>

      <mesh position={[90, 8, 190]} receiveShadow>
        <cylinderGeometry args={[2, 2, 16]} />
        <meshStandardMaterial color="#ff0000" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Center Platform */}
      <mesh position={[0, 1, 100]} receiveShadow>
        <cylinderGeometry args={[15, 15, 2]} />
        <meshStandardMaterial
          color="#d4c7c7"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
};
