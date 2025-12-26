import { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';

type WallProps = {
  position?: [number, number, number];
  size?: [number, number, number]; // width, height, depth
  color?: string;
};

export const Wall = ({
  position = [0, 2.5, -10],
  size = [10, 5, 0.5],
  color = '#555555',
}: WallProps) => {
  const [ref] = useBox(() => ({
    position,
    args: size,
    type: 'Static', // Static body, doesn't move but collides
  }));

  return (
    <mesh
      ref={ref as any}
      castShadow
      receiveShadow
    >
      {/* To‘rtburchak box */}
      <boxGeometry args={size} />

      {/* Oddiy polygon material */}
      <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={0.1}
        flatShading
      />
    </mesh>
  );
};
