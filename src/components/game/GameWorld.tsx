import { useState, useCallback, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { CyberGrid } from './CyberGrid';
import { Avatar } from './Avatar';
import { Environment } from './Environment';
import { CameraController } from './CameraController';
import { SpawnedObject, SpawnedObjectData } from './SpawnedObject';
import { CommandInput } from './CommandInput';
import { GameUI } from './GameUI';
import { useAICommand } from '@/hooks/useAICommand';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { toast } from 'sonner';
import { useVoiceChat } from '@/hooks/useVoiceChat';

export const GameWorld = () => {
  const [playerPosition, setPlayerPosition] = useState(new THREE.Vector3(0, 1, 0));
  const [playerRotation, setPlayerRotation] = useState(0);
  const [spawnedObjects, setSpawnedObjects] = useState<SpawnedObjectData[]>([]);

  const { localPlayerId, players, isConnected, updatePosition } = useMultiplayer();
  const { executeCommand, calculateSpawnPosition, isProcessing } = useAICommand(playerPosition);
  const { isConnected: voiceConnected, isMuted, isRecording, participants, startRecording, stopRecording, toggleMute } = useVoiceChat();

  const handlePositionChange = useCallback((pos: THREE.Vector3) => {
    setPlayerPosition(pos);
  }, []);

  const handleRotationChange = useCallback((rotation: number) => {
    setPlayerRotation(rotation);
  }, []);

  // Send position updates to server
  useEffect(() => {
    if (isConnected) {
      updatePosition(playerPosition, playerRotation);
    }
  }, [playerPosition, playerRotation, isConnected, updatePosition]);

  // Voice chat keyboard shortcuts
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, startRecording, stopRecording, toggleMute]);

  const handleCommand = useCallback(async (command: string) => {
    const response = await executeCommand(command);
    
    if (response.action === 'spawn' && response.asset_id && response.position) {
      const spawnPos = calculateSpawnPosition(response.position);
      const newObject: SpawnedObjectData = {
        id: `${response.asset_id}-${Date.now()}`,
        assetId: response.asset_id,
        position: spawnPos,
      };
      
      setSpawnedObjects(prev => [...prev, newObject]);
      toast.success(`"${response.asset_id.replace('.glb', '')}" yaratildi!`, {
        description: `Pozitsiya: X:${spawnPos.x.toFixed(1)}, Z:${spawnPos.z.toFixed(1)}`,
      });
    } else if (response.action === 'error') {
      toast.error("Xatolik", {
        description: response.message,
      });
    }
  }, [executeCommand, calculateSpawnPosition]);

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
          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 20, 10]} intensity={0.5} color="#ffffff" />
          <pointLight position={[0, 10, 0]} intensity={1} color="#00f5ff" distance={50} />
          
          {/* Fog for atmosphere */}
          <fog attach="fog" args={['#0a0a0f', 30, 100]} />
          
          {/* Stars background */}
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          
          {/* Cyber grid floor */}
          <CyberGrid />
          
          {/* Environment decorations */}
          <Environment />

          {/* Local player avatar */}
          <Avatar
            onPositionChange={handlePositionChange}
            onRotationChange={handleRotationChange}
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

          {/* Spawned objects */}
          {spawnedObjects.map((obj) => (
            <SpawnedObject key={obj.id} data={obj} />
          ))}
          
          {/* Camera follow */}
          <CameraController targetPosition={playerPosition} />
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <GameUI objectCount={spawnedObjects.length} />

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
