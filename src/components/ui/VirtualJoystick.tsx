import { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

interface VirtualJoystickProps {
  side: 'left' | 'right';
  onChange: (x: number, y: number, active: boolean) => void;
  size?: number;
  className?: string;
}

export const VirtualJoystick = ({
  side,
  onChange,
  size = 120,
  className = ''
}: VirtualJoystickProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [center, setCenter] = useState({ x: 0, y: 0 });
  const maxDistance = size / 2 - 20; // Leave some margin

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clamp to max distance
    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    const normalizedX = (clampedDistance / maxDistance) * Math.cos(angle);
    const normalizedY = (clampedDistance / maxDistance) * Math.sin(angle);

    // Update knob position
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${normalizedX * maxDistance}px, ${normalizedY * maxDistance}px)`;
    }

    // For right joystick, invert Y for camera pitch (up should be negative)
    const outputX = side === 'right' ? normalizedX : normalizedX;
    const outputY = side === 'right' ? -normalizedY : normalizedY;

    onChange(outputX, outputY, true);
  }, [maxDistance, onChange, side]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    setIsActive(true);
    const rect = containerRef.current.getBoundingClientRect();
    setCenter({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });

    updatePosition(clientX, clientY);
  }, [updatePosition]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isActive) return;
    updatePosition(clientX, clientY);
  }, [isActive, updatePosition]);

  const handleEnd = useCallback(() => {
    setIsActive(false);
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
    onChange(0, 0, false);
  }, [onChange]);

  // Touch events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleStart(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Mouse events (for desktop testing)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleEnd();
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{
        width: size,
        height: size,
        touchAction: 'none',
      }}
    >
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full border-2 border-white/30 bg-black/20 backdrop-blur-sm"
        style={{
          width: size,
          height: size,
        }}
      />

      {/* Inner deadzone indicator */}
      <div
        className="absolute rounded-full border border-white/10 bg-white/5"
        style={{
          width: size * 0.3,
          height: size * 0.3,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Knob */}
      <div
        ref={knobRef}
        className={`absolute rounded-full border-2 transition-all duration-75 ${
          isActive
            ? 'border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-400/50'
            : 'border-white/50 bg-white/10'
        }`}
        style={{
          width: size * 0.4,
          height: size * 0.4,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          touchAction: 'none',
        }}
      />

      {/* Center dot */}
      <div
        className="absolute rounded-full bg-white/30"
        style={{
          width: 4,
          height: 4,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};