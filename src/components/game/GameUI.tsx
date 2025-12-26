import { Gamepad2, Move, Box, Zap, ArrowUp, MousePointer, Settings, Users } from 'lucide-react';
import { useState } from 'react';

interface GameUIProps {
  objectCount: number;
  playerCount: number;
  physicsEnabled: boolean;
  onPhysicsToggle: (enabled: boolean) => void;
}

export const GameUI = ({ objectCount, playerCount, physicsEnabled, onPhysicsToggle }: GameUIProps) => {

  return (
    <>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
        <div className="glass-panel rounded-lg px-4 py-3 cyber-border">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-display text-lg text-foreground tracking-wider">CYBER WORLD</h1>
              <p className="text-xs text-muted-foreground">Virtual Muhit 3D</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-16">
           <div className="glass-panel rounded-lg px-4 py-3 cyber-border">
             <div className="flex items-center gap-3">
               <Users className="w-5 h-5 text-green-400" />
               <div>
                 <p className="text-sm text-foreground font-medium">{playerCount}</p>
                 <p className="text-xs text-muted-foreground">O'yinchilar</p>
               </div>
             </div>
           </div>

           <div className="glass-panel rounded-lg px-4 py-3 cyber-border">
             <div className="flex items-center gap-3">
               <Box className="w-5 h-5 text-secondary" />
               <div>
                 <p className="text-sm text-foreground font-medium">{objectCount}</p>
                 <p className="text-xs text-muted-foreground">Ob'yektlar</p>
               </div>
             </div>
           </div>

          <button
            onClick={() => onPhysicsToggle(!physicsEnabled)}
            className="glass-panel rounded-lg px-4 py-3 cyber-border hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className={`w-5 h-5 ${physicsEnabled ? 'text-green-400' : 'text-muted-foreground'}`} />
              <div>
                <p className="text-sm text-foreground font-medium">Fizika</p>
                <p className="text-xs text-muted-foreground">{physicsEnabled ? 'Yoqilgan' : 'O\'chirilgan'}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-24 left-4 pointer-events-none">
        <div className="glass-panel rounded-lg p-3 cyber-border">
          <div className="flex items-center gap-2 mb-2">
            <Move className="w-4 h-4 text-primary" />
            <span className="text-xs font-display text-primary">HARAKAT</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center mb-2">
            <div></div>
            <div className="bg-muted/50 rounded px-2 py-1 text-xs font-mono text-foreground">W</div>
            <div></div>
            <div className="bg-muted/50 rounded px-2 py-1 text-xs font-mono text-foreground">A</div>
            <div className="bg-muted/50 rounded px-2 py-1 text-xs font-mono text-foreground">S</div>
            <div className="bg-muted/50 rounded px-2 py-1 text-xs font-mono text-foreground">D</div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-muted-foreground">SHIFT - Yugurish</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <ArrowUp className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-muted-foreground">SPACE - Sakrash</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <MousePointer className="w-3 h-3 text-green-400" />
            <span className="text-xs text-muted-foreground">Chap tugma - Ko'rish</span>
          </div>
          <div className="flex items-center gap-2">
            <MousePointer className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-muted-foreground">O'ng tugma - Kamera</span>
          </div>
        </div>
      </div>
    </>
  );
};
