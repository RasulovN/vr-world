import { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import * as THREE from 'three';
import { CyberGrid } from './CyberGrid';
import { PlayerController, PlayerControllerRef } from './PlayerController';
import { Avatar } from './Avatar';
import { SpawnedObject, SpawnedObjectData } from './SpawnedObject';
import { CommandInput } from './CommandInput';
import { GameUI } from './GameUI';
import { useAICommand, AIResponse } from '@/hooks/useAICommand';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { toast } from 'sonner';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { Environment } from './Environment';
import { Yer } from './Yer';
import { Wall } from './Wall';
import { GameZone } from './GameZone';

interface GameWorldProps {
  physicsEnabled?: boolean;
  onPhysicsToggle?: (enabled: boolean) => void;
}

export const GameWorld = ({ physicsEnabled = false, onPhysicsToggle }: GameWorldProps) => {
  const playerControllerRef = useRef<PlayerControllerRef>(null);
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));
  const [playerYaw, setPlayerYaw] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0);
  const [spawnedObjects, setSpawnedObjects] = useState<SpawnedObjectData[]>([]);
  const [isNearZone, setIsNearZone] = useState(false);
  const [isInZone, setIsInZone] = useState(false);
  const [canEnterGameZone, setCanEnterGameZone] = useState(false);
  const [canExitGameZone, setCanExitGameZone] = useState(false);

  const { localPlayerId, players, spawnedObjects: multiplayerSpawnedObjects, isConnected, updatePosition, spawnObject } = useMultiplayer();
  const { executeCommand, calculateSpawnPosition, isProcessing } = useAICommand(playerPosition);
  const { isConnected: voiceConnected, isMuted, isRecording, participants, startRecording, stopRecording, toggleMute } = useVoiceChat();

  const handlePositionChange = useCallback((pos: THREE.Vector3) => {
    setPlayerPosition(pos);
  }, []);

  const handleYawChange = useCallback((yaw: number) => {
    setPlayerYaw(yaw);
  }, []);

  const handlePitchChange = useCallback((pitch: number) => {
    setCameraPitch(pitch);
  }, []);

  const handleNearZone = useCallback((near: boolean) => {
    setIsNearZone(near);
  }, []);

  const handleEnterZone = useCallback(() => {
    // Teleport player to center of GameZone
    const zoneCenter = new THREE.Vector3(0, 1, 150);
    playerControllerRef.current?.teleport(zoneCenter);
    setPlayerPosition(zoneCenter);
    setIsInZone(true);
    setCanEnterGameZone(false); // Reset trigger state
    toast.success("Game Zone ga kirdingiz! Otishma o'yinlariga tayyor bo'ling!", {
      description: "Arena chegaralarida ehtiyot bo'ling!",
    });
  }, []);

  const handleExitZone = useCallback(() => {
    // Teleport player outside GameZone
    const exitPos = new THREE.Vector3(0, 1, 50);
    playerControllerRef.current?.teleport(exitPos);
    setPlayerPosition(exitPos);
    setIsInZone(false);
    setCanExitGameZone(false); // Reset trigger state
    toast.info("Game Zone dan chiqdingiz");
  }, []);

  // Trigger callbacks for entrance/exit detection
  const handleEnterTrigger = useCallback((entered: boolean) => {
    if (!isInZone) {
      setCanEnterGameZone(entered);
    }
  }, [isInZone]);

  const handleExitTrigger = useCallback((entered: boolean) => {
    if (isInZone) {
      setCanExitGameZone(entered);
    }
  }, [isInZone]);

  // Send position updates to server
  useEffect(() => {
    if (isConnected) {
      updatePosition(playerPosition, playerYaw);
    }
  }, [playerPosition, playerYaw, isConnected, updatePosition]);

  // Voice chat keyboard shortcuts and zone entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      } else if (e.ctrlKey && e.key === 'm' || e.ctrlKey && e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if ((e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        if (canEnterGameZone) {
          handleEnterZone();
        } else if (canExitGameZone) {
          handleExitZone();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, startRecording, stopRecording, toggleMute, isNearZone, isInZone]);

  const handleCommand = useCallback(async (command: string) => {
    console.log('Processing command:', command);
    const response = await executeCommand(command);
    console.log('Command response:', response);

    if (response.action === 'spawn' && response.asset_id && response.position) {
      const quantity = response.quantity || 1;
      const newObjects: SpawnedObjectData[] = [];

      for (let i = 0; i < quantity; i++) {
        // Calculate position with slight variation for multiple objects
        const basePos = calculateSpawnPosition(response.position);
        const spawnPos = basePos.clone();

        if (quantity > 1) {
          // Add slight random offset for multiple objects
          const spread = 2; // units
          spawnPos.x += (Math.random() - 0.5) * spread;
          spawnPos.z += (Math.random() - 0.5) * spread;
        }

        const newObject: SpawnedObjectData = {
          id: `${response.asset_id}-${Date.now()}-${i}`,
          assetId: response.asset_id,
          position: spawnPos,
        };

        newObjects.push(newObject);

        // Send to other players
        console.log('Sending object to server:', newObject);
        spawnObject(newObject.id, newObject.assetId, newObject.position);
      }

      console.log(`Creating ${quantity} objects locally:`, newObjects);

      // Add all objects to local state at once
      setSpawnedObjects(prev => [...prev, ...newObjects]);

      const objectName = response.asset_id.replace('.glb', '');
      toast.success(`${quantity > 1 ? quantity + ' ta ' : ''}"${objectName}" ${quantity > 1 ? 'yaratildi' : 'yaratildi'}!`, {
        description: quantity > 1 ? `${quantity} ta ob'yekt joylashtirildi` : `Pozitsiya: X:${newObjects[0].position.x.toFixed(1)}, Z:${newObjects[0].position.z.toFixed(1)}`,
      });
    } else if (response.action === 'error') {
      toast.error("Xatolik", {
        description: response.message,
      });
    }
  }, [executeCommand, calculateSpawnPosition, spawnObject]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-background">
      <Canvas
        camera={{ position: [0, 10, 15], fov: 60 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a0f');
        }}
      >
        <Suspense fallback={null}>
          <Physics gravity={physicsEnabled ? [0, -9.81, 0] : [0, 0, 0]}>
            {/* Lighting */}
            <ambientLight intensity={0.2} />
            <directionalLight position={[10, 20, 10]} intensity={0.5} color="#ffffff" />
            <pointLight position={[0, 10, 0]} intensity={1} color="#00f5ff" distance={50} />

            {/* Fog for atmosphere */}
            <fog attach="fog" args={['#0a0a0f', 30, 100]} />

            {/* Cyber grid floor */}
            {/* <CyberGrid /> */}
            <Yer />


            {/* Environment decorations */}
            {/* <Environment /> */}

            <Wall />

            <GameZone
              setCanEnter={setCanEnterGameZone}
              setCanExit={setCanExitGameZone}
            />
            {/* Local player controller */}
            <PlayerController
              ref={playerControllerRef}
              onPositionChange={handlePositionChange}
              onYawChange={handleYawChange}
              onPitchChange={handlePitchChange}
              initialPosition={playerPosition}
              onNearZone={handleNearZone}
            />

            {/* Remote player avatars */}
            {Object.values(players).map((player) => (
              <Avatar
                key={player.id}
                isRemote={true}
                remotePosition={player.position}
                remoteRotation={player.rotation}
              />
            ))}

            {/* Spawned objects (local + multiplayer) */}
            {(() => {
              const allObjects = [
                ...spawnedObjects,
                ...Object.values(multiplayerSpawnedObjects).map(obj => ({
                  id: obj.id,
                  assetId: obj.assetId,
                  position: obj.position,
                }))
              ];
              console.log('Rendering objects:', allObjects);
              return allObjects.map((obj) => (
                <SpawnedObject key={obj.id} data={obj} />
              ));
            })()}

          </Physics>
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <GameUI
        objectCount={spawnedObjects.length}
        physicsEnabled={physicsEnabled}
        onPhysicsToggle={onPhysicsToggle || (() => {})}
      />

      {/* Game Zone Entry Hint */}
      {canEnterGameZone && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-center">
          <p className="text-sm">Press [E] to Enter GameZone</p>
        </div>
      )}

      {/* Game Zone Exit Hint */}
      {canExitGameZone && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-center">
          <p className="text-sm">Press [E] to Exit GameZone</p>
        </div>
      )}

      {/* In Zone UI */}
      {isInZone && (
        <div className="absolute top-4 left-4 bg-red-600/80 backdrop-blur-sm rounded-lg p-4 text-white">
          <h4 className="font-bold mb-2">⚠️ Game Zone da siz</h4>
          <p className="text-sm mb-2">Arena chegaralarida ehtiyot bo'ling!</p>
          <p className="text-xs">Chiqish uchun Q tugmasini bosing</p>
        </div>
      )}

      {/* Voice Chat UI */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {voiceConnected && (
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
              <span className="font-medium">
                {isRecording ? '🎤 Recording' : '🎤 Ready'}
              </span>
              {isMuted && <span className="text-red-400">🔇 Muted</span>}
            </div>
            <div className="text-xs text-gray-300">
              Ctrl+K: {isRecording ? 'Stop' : 'Start'} • M: Mute
            </div>
            {Object.keys(participants).length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-400 mb-1">Speaking:</div>
                {Object.entries(participants).map(([playerId, isSpeaking]) => (
                  isSpeaking && (
                    <div key={playerId} className="text-xs text-green-400">
                      Player {playerId.slice(0, 6)}...
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Command input */}
      <div className="absolute bottom-4 left-4 right-4 max-w-xl mx-auto">
        <CommandInput onCommand={handleCommand} isProcessing={isProcessing} />
      </div>
    </div>
  );
};
