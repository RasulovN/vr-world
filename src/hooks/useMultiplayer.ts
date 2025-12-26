import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as THREE from 'three';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/api/api';

export interface Player {
  id: string;
  position: THREE.Vector3;
  rotation: number;
}

export interface SpawnedObjectData {
  id: string;
  assetId: string;
  position: THREE.Vector3;
  playerId: string;
}

export interface MultiplayerState {
  localPlayerId: string | null;
  players: Record<string, Player>;
  spawnedObjects: Record<string, SpawnedObjectData>;
  isConnected: boolean;
}

export const useMultiplayer = () => {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<MultiplayerState>({
    localPlayerId: null,
    players: {},
    spawnedObjects: {},
    isConnected: false,
  });

  // Connect to WebSocket server
  useEffect(() => {
    const socket = io(`${API_BASE_URL}`, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to multiplayer server');
      setState(prev => ({ ...prev, isConnected: true, localPlayerId: socket.id }));
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from multiplayer server');
      setState(prev => ({ ...prev, isConnected: false, localPlayerId: null, players: {} }));
    });

    // Handle new player joining
    socket.on('playerJoined', (playerId: string) => {
      toast.success(`Player ${playerId.slice(0, 8)} joined the game`);
    });

    // Handle other players' updates
    socket.on('playerUpdate', (playerData: { id: string; position: THREE.Vector3; rotation: number }) => {
      setState(prev => ({
        ...prev,
        players: {
          ...prev.players,
          [playerData.id]: {
            id: playerData.id,
            position: new THREE.Vector3(playerData.position.x, playerData.position.y, playerData.position.z),
            rotation: playerData.rotation,
          },
        },
      }));
    });

    // Handle player disconnection
    socket.on('playerDisconnected', (playerId: string) => {
      setState(prev => {
        const newPlayers = { ...prev.players };
        delete newPlayers[playerId];
        return { ...prev, players: newPlayers };
      });
    });

    // Handle object spawning from other players
    socket.on('objectSpawned', (objectData: { id: string; assetId: string; position: THREE.Vector3; playerId: string }) => {
      console.log('Received spawned object:', objectData);
      setState(prev => ({
        ...prev,
        spawnedObjects: {
          ...prev.spawnedObjects,
          [objectData.id]: {
            id: objectData.id,
            assetId: objectData.assetId,
            position: new THREE.Vector3(objectData.position.x, objectData.position.y, objectData.position.z),
            playerId: objectData.playerId,
          },
        },
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Send local player position update
  const updatePosition = useCallback((position: THREE.Vector3, rotation: number) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('updatePosition', {
        position: { x: position.x, y: position.y, z: position.z },
        rotation,
      });
    }
  }, [state.isConnected]);

  // Send spawned object to other players
  const spawnObject = useCallback((id: string, assetId: string, position: THREE.Vector3) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('spawnObject', {
        id,
        assetId,
        position: { x: position.x, y: position.y, z: position.z },
      });
    }
  }, [state.isConnected]);

  return {
    ...state,
    updatePosition,
    spawnObject,
  };
};
