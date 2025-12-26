import { useRef } from 'react';
import { usePlane } from '@react-three/cannon';
import * as THREE from 'three';

export const Yer = () => {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    type: 'Static',
  }));

  return (
    <mesh
      ref={ref as any}
      receiveShadow
    >
      {/* Katta tekis polygon */}
      <planeGeometry args={[200, 200]} />

      {/* Oddiy material */}
      <meshStandardMaterial
        color="#298a43"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};
