import { useState, useEffect, useRef, useCallback } from 'react';

export interface GamepadState {
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    lb: boolean;
    rb: boolean;
    lt: boolean;
    rt: boolean;
    start: boolean;
    select: boolean;
    leftStick: boolean;
    rightStick: boolean;
    dpadUp: boolean;
    dpadDown: boolean;
    dpadLeft: boolean;
    dpadRight: boolean;
  };
}

export interface VirtualJoystickState {
  left: { x: number; y: number; active: boolean };
  right: { x: number; y: number; active: boolean };
}

const DEADZONE = 0.1;

export const useGamepadInput = () => {
  const [gamepadState, setGamepadState] = useState<GamepadState>({
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    buttons: {
      a: false, b: false, x: false, y: false,
      lb: false, rb: false, lt: false, rt: false,
      start: false, select: false,
      leftStick: false, rightStick: false,
      dpadUp: false, dpadDown: false, dpadLeft: false, dpadRight: false,
    },
  });

  const [virtualJoysticks, setVirtualJoysticks] = useState<VirtualJoystickState>({
    left: { x: 0, y: 0, active: false },
    right: { x: 0, y: 0, active: false },
  });

  const gamepadRef = useRef<Gamepad | null>(null);
  const animationFrameRef = useRef<number>();

  // Physical gamepad polling
  const pollGamepad = useCallback(() => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (gamepad) {
      gamepadRef.current = gamepad;

      const applyDeadzone = (value: number) => Math.abs(value) > DEADZONE ? value : 0;

      setGamepadState({
        leftStick: {
          x: applyDeadzone(gamepad.axes[0]),
          y: applyDeadzone(gamepad.axes[1]),
        },
        rightStick: {
          x: applyDeadzone(gamepad.axes[2]),
          y: applyDeadzone(gamepad.axes[3]),
        },
        buttons: {
          a: gamepad.buttons[0]?.pressed || false,
          b: gamepad.buttons[1]?.pressed || false,
          x: gamepad.buttons[2]?.pressed || false,
          y: gamepad.buttons[3]?.pressed || false,
          lb: gamepad.buttons[4]?.pressed || false,
          rb: gamepad.buttons[5]?.pressed || false,
          lt: gamepad.buttons[6]?.pressed || false,
          rt: gamepad.buttons[7]?.pressed || false,
          select: gamepad.buttons[8]?.pressed || false,
          start: gamepad.buttons[9]?.pressed || false,
          leftStick: gamepad.buttons[10]?.pressed || false,
          rightStick: gamepad.buttons[11]?.pressed || false,
          dpadUp: gamepad.buttons[12]?.pressed || false,
          dpadDown: gamepad.buttons[13]?.pressed || false,
          dpadLeft: gamepad.buttons[14]?.pressed || false,
          dpadRight: gamepad.buttons[15]?.pressed || false,
        },
      });
    }

    animationFrameRef.current = requestAnimationFrame(pollGamepad);
  }, []);

  // Gamepad connection handling
  useEffect(() => {
    const handleGamepadConnected = (e: GamepadEvent) => {
      console.log('Gamepad connected:', e.gamepad.id);
      gamepadRef.current = e.gamepad;
      if (!animationFrameRef.current) {
        pollGamepad();
      }
    };

    const handleGamepadDisconnected = (e: GamepadEvent) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      if (gamepadRef.current?.id === e.gamepad.id) {
        gamepadRef.current = null;
        setGamepadState({
          leftStick: { x: 0, y: 0 },
          rightStick: { x: 0, y: 0 },
          buttons: {
            a: false, b: false, x: false, y: false,
            lb: false, rb: false, lt: false, rt: false,
            start: false, select: false,
            leftStick: false, rightStick: false,
            dpadUp: false, dpadDown: false, dpadLeft: false, dpadRight: false,
          },
        });
      }
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    // Start polling if gamepad already connected
    const initialGamepads = navigator.getGamepads();
    if (initialGamepads[0] || initialGamepads[1] || initialGamepads[2] || initialGamepads[3]) {
      pollGamepad();
    }

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pollGamepad]);

  // Virtual joystick update functions
  const updateVirtualJoystick = useCallback((side: 'left' | 'right', x: number, y: number, active: boolean) => {
    setVirtualJoysticks(prev => ({
      ...prev,
      [side]: { x, y, active },
    }));
  }, []);

  // Combined input state
  const getCombinedInput = useCallback(() => {
    const physicalLeft = gamepadState.leftStick;
    const physicalRight = gamepadState.rightStick;
    const virtualLeft = virtualJoysticks.left;
    const virtualRight = virtualJoysticks.right;

    // Prioritize virtual joysticks if active, otherwise use physical
    const leftStick = virtualLeft.active ? virtualLeft : physicalLeft;
    const rightStick = virtualRight.active ? virtualRight : physicalRight;

    return {
      leftStick,
      rightStick,
      buttons: gamepadState.buttons,
      hasPhysicalGamepad: !!gamepadRef.current,
      hasVirtualInput: virtualLeft.active || virtualRight.active,
    };
  }, [gamepadState, virtualJoysticks]);

  return {
    gamepadState,
    virtualJoysticks,
    updateVirtualJoystick,
    getCombinedInput,
  };
};