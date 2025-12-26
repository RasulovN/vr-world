import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface MouseLookState {
  isPointerLocked: boolean;
  yaw: number; // Horizontal rotation (avatar Y rotation)
  pitch: number; // Vertical rotation (camera X rotation)
}

export const useMouseLook = (sensitivity: number = 0.002, pitchClamp: { min: number; max: number } = { min: -Math.PI / 4, max: Math.PI / 3 }) => {
  const [state, setState] = useState<MouseLookState>({
    isPointerLocked: false,
    yaw: 0,
    pitch: 0,
  });

  const lastMousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!state.isPointerLocked) return;

      const deltaX = e.movementX || 0;
      const deltaY = e.movementY || 0;

      setState((prev) => ({
        ...prev,
        yaw: prev.yaw - deltaX * sensitivity,
        pitch: Math.max(pitchClamp.min, Math.min(pitchClamp.max, prev.pitch - deltaY * sensitivity)),
      }));
    };

    const handlePointerLockChange = () => {
      setState((prev) => ({
        ...prev,
        isPointerLocked: document.pointerLockElement !== null,
      }));
    };

    const handleClick = () => {
      if (!state.isPointerLocked) {
        document.body.requestPointerLock?.();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('click', handleClick);
    };
  }, [state.isPointerLocked, sensitivity, pitchClamp]);

  const lockPointer = () => {
    document.body.requestPointerLock?.();
  };

  const unlockPointer = () => {
    document.exitPointerLock?.();
  };

  return {
    ...state,
    lockPointer,
    unlockPointer,
  };
};
