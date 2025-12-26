import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { Avatar } from './Avatar';

interface PlayerControllerProps {
  onPositionChange: (position: THREE.Vector3) => void;
  onYawChange: (yaw: number) => void;
  onPitchChange: (pitch: number) => void;
  initialPosition: THREE.Vector3;
}

export const PlayerController = ({
  onPositionChange,
  onYawChange,
  onPitchChange,
  initialPosition,
}: PlayerControllerProps) => {
  const { gl } = useThree();
  const positionRef = useRef(new THREE.Vector3().copy(initialPosition));
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  const [isMouseLookEnabled, setIsMouseLookEnabled] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(new THREE.Vector3().copy(initialPosition));
  const [currentYaw, setCurrentYaw] = useState(0);

  const keys = useKeyboardControls();

  // Movement parameters
  const baseSpeed = 0.05;
  const sprintMultiplier = 2.0;
  const acceleration = 0.02;
  const deceleration = 0.85;
  const jumpForce = 0.3;
  const gravity = 0.015;
  const mouseSensitivity = 0.002;
  const pitchClamp = { min: -Math.PI / 4, max: Math.PI / 3 };

  const verticalVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);

  // Mouse look toggle with right mouse button
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right mouse button
        e.preventDefault();
        if (isMouseLookEnabled) {
          // Disable mouse look
          document.exitPointerLock?.();
          setIsMouseLookEnabled(false);
        } else {
          // Enable mouse look
          gl.domElement.requestPointerLock?.();
        }
      }
    };

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === gl.domElement;
      setIsMouseLookEnabled(isLocked);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu on right click
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseLookEnabled) return;

      const deltaX = e.movementX || 0;
      const deltaY = e.movementY || 0;

      // Update yaw (horizontal rotation)
      yawRef.current -= deltaX * mouseSensitivity;

      // Update pitch (vertical rotation) with clamping
      pitchRef.current = Math.max(
        pitchClamp.min,
        Math.min(pitchClamp.max, pitchRef.current - deltaY * mouseSensitivity)
      );
    };

    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl.domElement, isMouseLookEnabled]);

  useFrame((state, delta) => {
    // Update current position and yaw for Avatar
    setCurrentPosition(positionRef.current.clone());
    setCurrentYaw(yawRef.current);

    // Notify parent of current yaw and pitch
    onYawChange(yawRef.current);
    onPitchChange(pitchRef.current);

    // Calculate movement direction relative to camera yaw
    const direction = new THREE.Vector3();

    if (keys.forward) direction.z -= 1;
    if (keys.backward) direction.z += 1;
    if (keys.left) direction.x -= 1;
    if (keys.right) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();

      // Rotate direction by current yaw to make movement relative to camera forward
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);

      // Calculate target speed with sprint multiplier
      const targetSpeed = baseSpeed * (keys.sprint ? sprintMultiplier : 1);
      direction.multiplyScalar(targetSpeed);

      // Apply acceleration
      velocityRef.current.add(direction);
    } else {
      // Apply deceleration when no input
      velocityRef.current.multiplyScalar(deceleration);
    }

    // Handle jumping
    if (keys.jump && isGroundedRef.current) {
      verticalVelocityRef.current = jumpForce;
      isGroundedRef.current = false;
    }

    // Apply gravity
    verticalVelocityRef.current -= gravity;

    // Update position
    positionRef.current.add(new THREE.Vector3(velocityRef.current.x, 0, velocityRef.current.z));
    positionRef.current.y += verticalVelocityRef.current;

    // Ground collision (simple ground at y=1)
    const groundY = 1;
    if (positionRef.current.y <= groundY) {
      positionRef.current.y = groundY;
      verticalVelocityRef.current = 0;
      isGroundedRef.current = true;
    }

    // Notify parent of position change
    onPositionChange(positionRef.current.clone());
  });

  return (
    <Avatar
      onPositionChange={onPositionChange}
      onRotationChange={onYawChange}
      isRemote={false}
    />
  );
};
