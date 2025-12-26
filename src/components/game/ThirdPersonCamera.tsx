import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ThirdPersonCameraProps {
  target: THREE.Vector3; // Avatar position
  yaw: number; // Avatar yaw rotation
  pitch: number; // Camera pitch from mouse look
  distance?: number; // Distance behind avatar
  height?: number; // Height above avatar
  lerpFactor?: number; // Smooth interpolation factor
}

export const ThirdPersonCamera = ({
  target,
  yaw,
  pitch,
  distance = 5,
  height = 2,
  lerpFactor = 0.1
}: ThirdPersonCameraProps) => {
  const { camera } = useThree();
  const cameraPositionRef = useRef(new THREE.Vector3());
  const cameraTargetRef = useRef(new THREE.Vector3());

  useFrame(() => {
    // Calculate ideal camera position behind and above the avatar
    const offset = new THREE.Vector3(0, 0, distance);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw); // Rotate by avatar yaw
    offset.y = height; // Set height

    const idealPosition = new THREE.Vector3().copy(target).add(offset);

    // Apply pitch rotation to the camera position
    const pitchRotation = new THREE.Quaternion();
    pitchRotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
    idealPosition.sub(target).applyQuaternion(pitchRotation).add(target);

    // Ensure camera doesn't go below ground level
    idealPosition.y = Math.max(idealPosition.y, 0.5);

    // Check if camera would clip through avatar (too close)
    const distanceToAvatar = idealPosition.distanceTo(target);
    if (distanceToAvatar < 2) {
      // Push camera back if too close
      const direction = new THREE.Vector3().subVectors(idealPosition, target).normalize();
      idealPosition.copy(target).add(direction.multiplyScalar(2));
    }

    // Smooth interpolation to ideal position
    cameraPositionRef.current.lerp(idealPosition, lerpFactor);
    camera.position.copy(cameraPositionRef.current);

    // Calculate look-at target (slightly above avatar position)
    const lookAtTarget = new THREE.Vector3(target.x, target.y + 1.5, target.z);
    cameraTargetRef.current.lerp(lookAtTarget, lerpFactor);

    camera.lookAt(cameraTargetRef.current);
  });

  return null;
};
