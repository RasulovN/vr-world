import { useState, useCallback } from 'react';
import * as THREE from 'three';

export interface AIResponse {
  action: 'spawn' | 'error';
  asset_id?: string;
  position?: string;
  quantity?: number;
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
  { id: 'buggati.glb', name: 'buggati', tags: ['buggati', 'buggati', 'car2'] },
];

export const useAICommand = (playerPosition: THREE.Vector3) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

  const processCommand = useCallback(async (command: string): Promise<AIResponse> => {
    const lowerCommand = command.toLowerCase();

    // Extract quantity (supports: 2, 3, 4, 5, ikkita, uchta, to'rtta, beshta)
    let quantity = 1;
    const quantityPatterns = [
      /\b(\d+)\s*ta\b/,  // 2 ta, 3 ta
      /\b(ikkita|uchta|t[oö]rtta|beshta|oltita|ettita)\b/,  // Uzbek words
    ];

    for (const pattern of quantityPatterns) {
      const match = lowerCommand.match(pattern);
      if (match) {
        if (match[1].match(/\d+/)) {
          quantity = parseInt(match[1]);
        } else {
          // Uzbek words to numbers
          const wordToNum: { [key: string]: number } = {
            'ikkita': 2, 'uchta': 3, 'törtta': 4, 'to\'rtta': 4, 'beshta': 5,
            'oltita': 6, 'ettita': 7
          };
          quantity = wordToNum[match[1]] || 1;
        }
        break;
      }
    }

    // Limit quantity to prevent spam
    quantity = Math.min(quantity, 10);

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
        quantity: quantity,
      };
    }

    return {
      action: 'error',
      message: "Ob'yekt topilmadi. Mavjud: stol, stul, mashina, daraxt, chiroq, shar. Misol: '2 ta stol' yoki 'uchta daraxt'",
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
    const baseOffset = 3;
    const pos = playerPosition.clone();

    switch (positionType) {
      case 'front':
        pos.z -= baseOffset;
        break;
      case 'back':
        pos.z += baseOffset;
        break;
      case 'left':
        pos.x -= baseOffset;
        break;
      case 'right':
        pos.x += baseOffset;
        break;
      default:
        // Improved random position near player - ensure objects don't overlap
        const randomOffset = baseOffset + Math.random() * 2; // 3-5 units
        const angle = Math.random() * Math.PI * 2; // Random angle around player
        pos.x += Math.cos(angle) * randomOffset;
        pos.z += Math.sin(angle) * randomOffset;
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
