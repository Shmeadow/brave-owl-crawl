"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAmbientSound } from '@/hooks/use-ambient-sound';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AmbientSoundItemProps {
  name: string;
  url: string;
  isCurrentRoomWritable: boolean;
}

export function AmbientSoundItem({ name, url, isCurrentRoomWritable }: AmbientSoundItemProps) {
  const { isPlaying, volume, isMuted, togglePlayPause, setVolume, toggleMute } = useAmbientSound(url);

  const handleTogglePlayPause = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    togglePlayPause();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(parseFloat(e.target.value));
  };

  const handleToggleMute = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    toggleMute();
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl">
      <span className="font-medium text-sm text-foreground flex-1 truncate pr-2">{name}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleTogglePlayPause}
          disabled={!isCurrentRoomWritable}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'} {name}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggleMute}
          disabled={!isCurrentRoomWritable}
        >
          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'} {name}</span>
        </Button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className={cn(
            "w-20 h-1 rounded-lg appearance-none cursor-pointer accent-primary",
            !isCurrentRoomWritable && "opacity-50 cursor-not-allowed"
          )}
          disabled={!isCurrentRoomWritable}
        />
      </div>
    </div>
  );
}