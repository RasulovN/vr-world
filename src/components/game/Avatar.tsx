import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AvatarProps {
  isRemote?: boolean;
  remotePosition?: THREE.Vector3;
  remoteRotation?: number;
  isMoving?: boolean;
  isSprinting?: boolean;
}

export const Avatar = ({ isRemote = false, remotePosition, remoteRotation, isMoving = false, isSprinting = false }: AvatarProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Procedural avatar refs
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  // Animation state
  const walkCycleRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    if (isRemote) {
      // For remote players, directly set position and rotation from props
      if (remotePosition) {
        groupRef.current.position.copy(remotePosition);
      }
      if (remoteRotation !== undefined) {
        groupRef.current.rotation.y = remoteRotation;
      }
      return;
    }

    // Handle procedural animations
    if (isMoving) {
      // Walking animation
      walkCycleRef.current += isSprinting ? 0.3 : 0.15;

      // Animate legs
      const legSwing = Math.sin(walkCycleRef.current) * 0.5;
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = legSwing;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -legSwing;
      }

      // Animate arms (opposite to legs)
      const armSwing = Math.sin(walkCycleRef.current) * 0.3;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -armSwing;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = armSwing;
      }

      // Slight body bob
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.abs(Math.sin(walkCycleRef.current * 2)) * 0.05;
      }
    } else {
      // Idle animation - reset to neutral positions
      walkCycleRef.current = 0;

      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.9;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.9;
      if (bodyRef.current) bodyRef.current.position.y *= 0.9;

      // Breathing animation
      if (bodyRef.current) {
        bodyRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Body */}
      <mesh ref={bodyRef} position={[0, 1.2, 0]}>
        <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
        <meshStandardMaterial color="#4169e1" />
      </mesh>

      {/* Left Arm */}
      <mesh ref={leftArmRef} position={[-0.3, 1.4, 0]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Right Arm */}
      <mesh ref={rightArmRef} position={[0.3, 1.4, 0]}>
        <capsuleGeometry args={[0.08, 0.6, 8, 16]} />
        <meshStandardMaterial color="#ffdbac" />
      </mesh>

      {/* Left Leg */}
      <mesh ref={leftLegRef} position={[-0.15, 0.4, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color="#000080" />
      </mesh>

      {/* Right Leg */}
      <mesh ref={rightLegRef} position={[0.15, 0.4, 0]}>
        <capsuleGeometry args={[0.1, 0.8, 8, 16]} />
        <meshStandardMaterial color="#000080" />
      </mesh>

      {/* Glow ring around body */}
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.03, 8, 32]} />
        <meshStandardMaterial
          color="#00f5ff"
          emissive="#00f5ff"
          emissiveIntensity={2}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Point light for glow effect */}
      <pointLight color="#00f5ff" intensity={2} distance={10} />
    </group>
  );
};
