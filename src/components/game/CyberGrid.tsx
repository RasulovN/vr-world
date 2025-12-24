import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const CyberGrid = () => {
  const gridRef = useRef<THREE.Mesh>(null);

  const gridMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#00f5ff') },
        uColor2: { value: new THREE.Color('#ff00ff') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec2 grid = abs(fract(vPosition.xz * 0.5 - 0.5) - 0.5) / fwidth(vPosition.xz * 0.5);
          float line = min(grid.x, grid.y);
          float gridLine = 1.0 - min(line, 1.0);
          
          float pulse = sin(length(vPosition.xz) * 0.3 - uTime * 2.0) * 0.5 + 0.5;
          vec3 color = mix(uColor1, uColor2, pulse);
          
          float alpha = gridLine * (0.3 + pulse * 0.2);
          alpha *= smoothstep(100.0, 20.0, length(vPosition.xz));
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  useFrame((state) => {
    if (gridMaterial.uniforms) {
      gridMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={gridMaterial}>
      <planeGeometry args={[200, 200, 1, 1]} />
    </mesh>
  );
};
