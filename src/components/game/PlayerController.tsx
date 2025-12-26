import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { useGamepadInput } from '@/hooks/useGamepadInput';
import { Avatar } from './Avatar';

interface PlayerControllerProps {
  onPositionChange: (position: THREE.Vector3) => void;
  onYawChange: (yaw: number) => void;
  onPitchChange: (pitch: number) => void;
  initialPosition: THREE.Vector3;
  onNearZone?: (near: boolean) => void;
}

export interface PlayerControllerRef {
  teleport: (position: THREE.Vector3) => void;
}

type CameraMode = 'follow' | 'head';

export const PlayerController = forwardRef<PlayerControllerRef, PlayerControllerProps>(({
  onPositionChange,
  onYawChange,
  onPitchChange,
  initialPosition,
  onNearZone,
}, ref) => {
  const { gl } = useThree();
  const playerRootRef = useRef<THREE.Group>(null);
  const cameraPivotRef = useRef<THREE.Group>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  const positionRef = useRef(new THREE.Vector3().copy(initialPosition));
  const velocityRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  const [cameraMode, setCameraMode] = useState<CameraMode>('follow');
  const [isMouseLookEnabled, setIsMouseLookEnabled] = useState(false);

  const keys = useKeyboardControls();
  const { getCombinedInput, updateVirtualJoystick } = useGamepadInput();

  // Movement parameters
  const baseSpeed = 0.03;
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

    // Mode switching with 'C' key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setCameraMode(prev => prev === 'follow' ? 'head' : 'follow');
      }
    };

    gl.domElement.addEventListener('mousedown', handleMouseDown);
    gl.domElement.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      gl.domElement.removeEventListener('mousedown', handleMouseDown);
      gl.domElement.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [gl.domElement, isMouseLookEnabled]);

  useFrame((state, delta) => {
    if (!playerRootRef.current || !cameraPivotRef.current || !cameraRef.current) return;

    // Notify parent of current yaw and pitch
    onYawChange(yawRef.current);
    onPitchChange(pitchRef.current);

    // Calculate movement direction relative to yaw (camera forward)
    const direction = new THREE.Vector3();

    if (keys.forward) direction.z -= 1;
    if (keys.backward) direction.z += 1;
    if (keys.left) direction.x -= 1;
    if (keys.right) direction.x += 1;

    const isMoving = direction.length() > 0;
    const isSprinting = keys.sprint;

    if (isMoving) {
      direction.normalize();

      // Rotate direction by current yaw to make movement relative to forward
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yawRef.current);

      // Calculate target speed with sprint multiplier
      const targetSpeed = baseSpeed * (isSprinting ? sprintMultiplier : 1);
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

    // Apply position and rotations
    playerRootRef.current.position.copy(positionRef.current);
    playerRootRef.current.rotation.y = yawRef.current;
    cameraPivotRef.current.rotation.x = pitchRef.current;

    // Set camera position based on mode
    if (cameraMode === 'follow') {
      // Behind and above avatar
      cameraRef.current.position.set(0, 2, -5);
    } else {
      // At avatar head
      cameraRef.current.position.set(0, 1.8, 5);
    }

    // Check if near GameZone (position [0, 0, 50])
    const zonePosition = new THREE.Vector3(0, 0, 50);
    const distanceToZone = positionRef.current.distanceTo(zonePosition);
    const isNearZone = distanceToZone < 10; // 10 units radius

    if (onNearZone) {
      onNearZone(isNearZone);
    }

    // Notify parent of position change
    onPositionChange(positionRef.current);
  });

  // Expose teleport method via ref
  useImperativeHandle(ref, () => ({
    teleport: (position: THREE.Vector3) => {
      positionRef.current.copy(position);
      if (playerRootRef.current) {
        playerRootRef.current.position.copy(position);
      }
    },
  }));

  return (
    <group ref={playerRootRef}>
      <Avatar
        isRemote={false}
        isMoving={velocityRef.current.length() > 0.01}
        isSprinting={keys.sprint}
      />
      <group ref={cameraPivotRef}>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          fov={60}
          near={0.1}
          far={1000}
        />
      </group>
    </group>
  );
});
