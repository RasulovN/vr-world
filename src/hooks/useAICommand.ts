import { useState, useCallback } from 'react';
import * as THREE from 'three';

interface AIResponse {
  action: 'spawn' | 'error';
  asset_id?: string;
  position?: string;
  message?: string;
}

const assetDatabase = [
  { id: 'table_wood.glb', name: 'stol', tags: ['stol', 'desk', 'table', 'mebel', 'furniture'] },
  { id: 'chair_modern.glb', name: 'stul', tags: ['stul', 'chair', 'seat', 'o\'tirg\'ich'] },
  { id: 'car_sedan.glb', name: 'mashina', tags: ['mashina', 'car', 'vehicle', 'avtomobil'] },
  { id: 'tree_oak.glb', name: 'daraxt', tags: ['daraxt', 'tree', 'nature', 'o\'simlik'] },
  { id: 'forset.glb', name: 'forset', tags: ['forset', 'forset', 'nature', 'o\'rmon'] },
  { id: 'lamp_floor.glb', name: 'chiroq', tags: ['chiroq', 'lamp', 'light', 'yorug\'lik'] },
  { id: 'sphere_glow.glb', name: 'shar', tags: ['shar', 'sphere', 'ball', 'to\'p'] },
  { id: 'city_scene.glb', name: 'city', tags: ['city', 'scene', 'urban', 'metropolis'] },
  { id: 'ak_47_pbr.glb', name: 'ak_47', tags: ['ak_47', 'weapon', 'gun', 'firearm'] },
  { id: 'cybr_truck.glb', name: 'cybr_truck', tags: ['cybr_truck', 'vehicle', 'truck'] },
  { id: 'buggati.glb', name: 'buggati', tags: ['cybr_truck', 'buggati', 'truck'] },
];

export const useAICommand = (playerPosition: THREE.Vector3) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

  const processCommand = useCallback(async (command: string): Promise<AIResponse> => {
    const lowerCommand = command.toLowerCase();
    
    // Find matching asset
    let matchedAsset = null;
    for (const asset of assetDatabase) {
      for (const tag of asset.tags) {
        if (lowerCommand.includes(tag)) {
          matchedAsset = asset;
          break;
        }
      }
      if (matchedAsset) break;
    }

    if (matchedAsset) {
      // Determine position based on command
      let positionType = 'near_player';
      if (lowerCommand.includes('oldimda') || lowerCommand.includes('oldin')) {
        positionType = 'front';
      } else if (lowerCommand.includes('orqamda') || lowerCommand.includes('orqa')) {
        positionType = 'back';
      } else if (lowerCommand.includes('chapda') || lowerCommand.includes('chap')) {
        positionType = 'left';
      } else if (lowerCommand.includes('o\'ngda') || lowerCommand.includes('o\'ng')) {
        positionType = 'right';
      }

      return {
        action: 'spawn',
        asset_id: matchedAsset.id,
        position: positionType,
      };
    }

    return {
      action: 'error',
      message: "Ob'yekt topilmadi. Mavjud: stol, stul, mashina, daraxt, chiroq, shar",
    };
  }, []);

  const executeCommand = useCallback(async (command: string) => {
    setIsProcessing(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const response = await processCommand(command);
    setLastResponse(response);
    setIsProcessing(false);
    
    return response;
  }, [processCommand]);

  const calculateSpawnPosition = useCallback((positionType: string): THREE.Vector3 => {
    const offset = 3;
    const pos = playerPosition.clone();
    
    switch (positionType) {
      case 'front':
        pos.z -= offset;
        break;
      case 'back':
        pos.z += offset;
        break;
      case 'left':
        pos.x -= offset;
        break;
      case 'right':
        pos.x += offset;
        break;
      default:
        // Random position near player
        pos.x += (Math.random() - 0.5) * offset * 2;
        pos.z += (Math.random() - 0.5) * offset * 2;
    }
    
    pos.y = 0;
    return pos;
  }, [playerPosition]);

  return {
    executeCommand,
    calculateSpawnPosition,
    isProcessing,
    lastResponse,
  };
};
