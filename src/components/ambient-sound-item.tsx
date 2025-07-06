"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music, Loader2 } from "lucide-react";
import { useAmbientSound } from "@/hooks/use-ambient-sound";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AmbientSoundItemProps {
  name: string;
  url: string;
  isCurrentRoomWritable: boolean;
}

const getSoundIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('rain') || lowerName.includes('water') || lowerName.includes('ocean') || lowerName.includes('river') || lowerName.includes('thunder')) {
    return <Volume2 className="h-5 w-5 text-primary" />;
  }
  if (lowerName.includes('wind') || lowerName.includes('forest') || lowerName.includes('bird') || lowerName.includes('jungle') || lowerName.includes('desert')) {
    return <Volume2 className="h-5 w-5 text-primary" />;
  }
  if (lowerName.includes('cafe') || lowerName.includes('city') || lowerName.includes('train')) {
    return <Volume2 className="h-5 w-5 text-primary" />;
  }
  if (lowerName.includes('fire') || lowerName.includes('space') || lowerName.includes('zen') || lowerName.includes('ambiance')) {
    return <Volume2 className="h-5 w-5 text-primary" />;
  }
  if (lowerName.includes('noise')) {
    return <Volume2 className="h-5 w-5 text-primary" />;
  }
  return <Music className="h-5 w-5 text-primary" />;
};


export function AmbientSoundItem({ name, url, isCurrentRoomWritable }: AmbientSoundItemProps) {
  const { isPlaying, volume, isMuted, isBuffering, togglePlayPause, setVolume, toggleMute } = useAmbientSound(url);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent parent div's onClick
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(parseFloat(e.target.value));
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent div's onClick
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    toggleMute();
  };

  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    togglePlayPause();
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-md border border-border bg-card backdrop-blur-xl shadow-sm transition-all duration-200",
        isPlaying ? "bg-primary/10 border-primary" : "hover:bg-muted/50",
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
    >
      {/* Icon and Name Area */}
      <div className="flex items-center gap-2 flex-grow min-w-0">
        {isBuffering && isPlaying ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          getSoundIcon(name)
        )}
        <span className="font-medium text-sm truncate text-foreground">{name}</span>
      </div>

      {/* Controls Area */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={handleTogglePlayPause}
          disabled={!isCurrentRoomWritable}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'} {name}</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
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
            "w-20 h-1.5 rounded-lg appearance-none cursor-pointer accent-primary bg-muted-foreground/30",
            !isCurrentRoomWritable && "opacity-50 cursor-not-allowed"
          )}
          disabled={!isCurrentRoomWritable}
        />
      </div>
    </div>
  );
}