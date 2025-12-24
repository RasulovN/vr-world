import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Sparkles } from 'lucide-react';

interface CommandInputProps {
  onCommand: (command: string) => void;
  isProcessing: boolean;
}

export const CommandInput = ({ onCommand, isProcessing }: CommandInputProps) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onCommand(input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="glass-panel rounded-lg p-4 cyber-border">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-sm font-display text-primary">AI BUYRUQ</span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Masalan: 'yonimga stol chiqar' yoki 'daraxt qo'y'"
          className="flex-1 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
          disabled={isProcessing}
        />
        <Button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/80 cyber-glow"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-2">
        "/" tugmasini bosib tezkor kiritish • WASD yoki strelkalar bilan harakat
      </p>
    </div>
  );
};
