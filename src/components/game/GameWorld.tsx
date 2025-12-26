import { useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import * as THREE from 'three';
import { CyberGrid } from './CyberGrid';
import { PlayerController } from './PlayerController';
import { Avatar } from './Avatar';
import { SpawnedObject, SpawnedObjectData } from './SpawnedObject';
import { CommandInput } from './CommandInput';
import { GameUI } from './GameUI';
import { useAICommand } from '@/hooks/useAICommand';
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
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));
  const [playerYaw, setPlayerYaw] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0);
  const [spawnedObjects, setSpawnedObjects] = useState<SpawnedObjectData[]>([]);
  const [isNearZone, setIsNearZone] = useState(false);
  const [isInZone, setIsInZone] = useState(false);

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
    // Move player to center of GameZone
    const zoneCenter = new THREE.Vector3(0, 1, 100);
    setPlayerPosition(zoneCenter);
    setIsInZone(true);
    toast.success("Game Zone ga kirdingiz! Otishma o'yinlariga tayyor bo'ling!", {
      description: "Arena chegaralarida ehtiyot bo'ling!",
    });
  }, []);

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
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if ((e.key === 'e' || e.key === 'E') && isNearZone && !isInZone) {
        e.preventDefault();
        handleEnterZone();
      } else if ((e.key === 'q' || e.key === 'Q') && isInZone) {
        e.preventDefault();
        // Exit zone
        const exitPos = new THREE.Vector3(0, 1, 50);
        setPlayerPosition(exitPos);
        setIsInZone(false);
        toast.info("Game Zone dan chiqdingiz");
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
      const spawnPos = calculateSpawnPosition(response.position);
      const newObject: SpawnedObjectData = {
        id: `${response.asset_id}-${Date.now()}`,
        assetId: response.asset_id,
        position: spawnPos,
      };

      console.log('Creating object locally:', newObject);

      // Add to local state
      setSpawnedObjects(prev => [...prev, newObject]);

      // Send to other players
      console.log('Sending object to server...');
      spawnObject(newObject.id, newObject.assetId, newObject.position);

      toast.success(`"${response.asset_id.replace('.glb', '')}" yaratildi!`, {
        description: `Pozitsiya: X:${spawnPos.x.toFixed(1)}, Z:${spawnPos.z.toFixed(1)}`,
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

            <GameZone />
            {/* Local player controller */}
            <PlayerController
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

      {/* Game Zone Entry/Exit UI */}
      {isNearZone && !isInZone && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-4">🚀 Game Zone ga kirish</h3>
          <p className="mb-4">Siz Game Zone yaqinidasiz. Otishma arenasi uchun E tugmasini bosing.</p>
          <button
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium"
            onClick={handleEnterZone}
          >
            Kirish (E)
          </button>
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
