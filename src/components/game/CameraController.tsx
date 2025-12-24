import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraControllerProps {
  targetPosition: THREE.Vector3;
  targetRotation?: number;
}

export const CameraController = ({ targetPosition, targetRotation = 0 }: CameraControllerProps) => {
  const { camera, gl } = useThree();
  const offset = useRef(new THREE.Vector3(0, 5, 8));
  const isRightMouseDown = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ x: -0.3, y: 0 }); // Start with slight downward angle
  const mouseSensitivity = 0.002;
  const maxVerticalAngle = Math.PI / 2.2; // Limit vertical rotation

  // Mouse controls for camera rotation
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) { // Right mouse button
        e.preventDefault();
        isRightMouseDown.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        gl.domElement.requestPointerLock?.();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isRightMouseDown.current = false;
        document.exitPointerLock?.();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isRightMouseDown.current) return;

      const deltaX = e.movementX || (e.clientX - lastMousePos.current.x);
      const deltaY = e.movementY || (e.clientY - lastMousePos.current.y);

      // Horizontal rotation (Y axis)
      cameraRotation.current.y -= deltaX * mouseSensitivity;

      // Vertical rotation (X axis) with limits
      cameraRotation.current.x -= deltaY * mouseSensitivity;
      cameraRotation.current.x = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, cameraRotation.current.x));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu on right click
    };

    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl]);

  useFrame(() => {
    // Position camera behind avatar based on avatar's rotation
    const behindOffset = new THREE.Vector3(0, 0, 8); // Behind avatar
    behindOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);

    const cameraPos = new THREE.Vector3()
      .copy(targetPosition)
      .add(behindOffset);
    cameraPos.y += 5; // Camera height

    camera.position.lerp(cameraPos, 0.1);

    const lookAtTarget = new THREE.Vector3().copy(targetPosition);
    lookAtTarget.y += 1.5; // Look at avatar's head level

    camera.lookAt(lookAtTarget);
  });

  return null;
};
