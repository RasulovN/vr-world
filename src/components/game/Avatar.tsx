import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AvatarProps {
  onPositionChange?: (position: THREE.Vector3) => void;
  onRotationChange?: (rotation: number) => void;
  isRemote?: boolean;
  remotePosition?: THREE.Vector3;
  remoteRotation?: number;
}

export const Avatar = ({ onPositionChange, onRotationChange, isRemote = false, remotePosition, remoteRotation }: AvatarProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const rotationRef = useRef(0);
  const isMobileRef = useRef(false);
  const gyroBaseRef = useRef<number | null>(null);
  const isMouseLooking = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const mouseSensitivity = 0.002;

  
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
  });

  const baseSpeed = 0.05;
  const sprintMultiplier = 2.0;
  const acceleration = 0.01;
  const deceleration = 0.9;
  const jumpForce = 0.3;
  const gravity = 0.015;
  const gyroSensitivity = 0.02;

  const isGroundedRef = useRef(true);
  const verticalVelocityRef = useRef(0);

  // Procedural avatar refs
  const headRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  // Animation state
  const walkCycleRef = useRef(0);
  const isWalkingRef = useRef(false);

  // Detect mobile device (only for local player)
  useEffect(() => {
    if (isRemote) return;
    isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);



  // Gyroscope for mobile
  useEffect(() => {
    if (!isMobileRef.current) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null) return;
      
      // Set base rotation on first reading
      if (gyroBaseRef.current === null) {
        gyroBaseRef.current = e.gamma;
      }
      
      // Calculate rotation based on device tilt (gamma = left/right tilt)
      const gammaDelta = (e.gamma - gyroBaseRef.current) * gyroSensitivity;
      rotationRef.current = -gammaDelta;
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (error) {
          console.warn('Gyroscope permission denied');
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    // Add touch event to trigger permission request on iOS
    const handleTouch = () => {
      requestPermission();
      document.removeEventListener('touchstart', handleTouch);
    };
    
    document.addEventListener('touchstart', handleTouch);
    requestPermission();

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      document.removeEventListener('touchstart', handleTouch);
    };
  }, [isRemote]);

  // Keyboard controls (only for local player)
  useEffect(() => {
    if (isRemote) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: true }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: true }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: true }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: true }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys((k) => ({ ...k, sprint: true }));
          break;
        case 'Space':
          e.preventDefault();
          setKeys((k) => ({ ...k, jump: true }));
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((k) => ({ ...k, forward: false }));
          break;
        case 'KeyS':
        case 'ArrowDown':
          setKeys((k) => ({ ...k, backward: false }));
          break;
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((k) => ({ ...k, left: false }));
          break;
        case 'KeyD':
        case 'ArrowRight':
          setKeys((k) => ({ ...k, right: false }));
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys((k) => ({ ...k, sprint: false }));
          break;
        case 'Space':
          setKeys((k) => ({ ...k, jump: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Mouse look controls (only for local player)
  useEffect(() => {
    if (isRemote) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseLooking.current) return;

      const deltaX = e.movementX || (e.clientX - lastMousePos.current.x);
      const deltaY = e.movementY || (e.clientY - lastMousePos.current.y);

      // Horizontal rotation (around Y axis)
      rotationRef.current -= deltaX * mouseSensitivity;

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        isMouseLooking.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        document.body.requestPointerLock?.();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseLooking.current = false;
        document.exitPointerLock?.();
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement) {
        isMouseLooking.current = true;
      } else {
        isMouseLooking.current = false;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [isRemote, mouseSensitivity]);

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

    // Calculate movement direction (relative to world/camera)
    const direction = new THREE.Vector3();

    if (keys.forward) direction.z -= 1;
    if (keys.backward) direction.z += 1;
    if (keys.left) direction.x -= 1;
    if (keys.right) direction.x += 1;

    if (direction.length() > 0) {
      // Only rotate towards movement direction if not using mouse look
      if (!isMouseLooking.current) {
        direction.normalize();

        // Calculate target rotation based on movement direction
        const targetRotation = Math.atan2(direction.x, direction.z);

        // Smooth rotation towards movement direction
        const currentRotation = rotationRef.current;
        const rotationDiff = targetRotation - currentRotation;

        // Normalize rotation difference to [-PI, PI]
        const normalizedDiff = ((rotationDiff + Math.PI) % (Math.PI * 2)) - Math.PI;

        // Apply smooth rotation
        rotationRef.current += normalizedDiff * 0.1;
      }

      // Calculate target speed with sprint multiplier
      const targetSpeed = baseSpeed * (keys.sprint ? sprintMultiplier : 1);
      direction.multiplyScalar(targetSpeed);

      // Apply acceleration
      velocityRef.current.add(direction);
    } else {
      // Apply deceleration when no input
      velocityRef.current.multiplyScalar(deceleration);
    }

    // Apply rotation to avatar
    groupRef.current.rotation.y = rotationRef.current;

    // Notify parent of rotation change
    onRotationChange?.(rotationRef.current);

    // Handle procedural animations
    const isMoving = velocityRef.current.length() > 0.01;
    isWalkingRef.current = isMoving;

    if (isMoving) {
      // Walking animation
      walkCycleRef.current += keys.sprint ? 0.3 : 0.15;

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

    // Apply horizontal movement (no collision detection)
    groupRef.current.position.add(new THREE.Vector3(velocityRef.current.x, 0, velocityRef.current.z));

    // Apply gravity and jumping
    verticalVelocityRef.current -= gravity;
    groupRef.current.position.y += verticalVelocityRef.current;

    // Ground collision (simple ground at y=1)
    const groundY = 1;
    if (groupRef.current.position.y <= groundY) {
      groupRef.current.position.y = groundY;
      verticalVelocityRef.current = 0;
      isGroundedRef.current = true;
    }

    // Floating animation when grounded
    if (isGroundedRef.current) {
      const floatY = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.position.y = groundY + floatY;
    }

    onPositionChange(groupRef.current.position.clone());
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
      <pointLight color="#00f5ff" intensity={2} distance={5} />
    </group>
  );
};
