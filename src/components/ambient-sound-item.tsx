"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music } from "lucide-react"; // Added Music icon for generic sounds
import { useAmbientSound } from "@/hooks/use-ambient-sound";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AmbientSoundItemProps {
  name: string;
  url: string;
  isCurrentRoomWritable: boolean;
}

// Helper to get a relevant icon based on sound name/category (can be expanded)
const getSoundIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('rain') || lowerName.includes('water') || lowerName.includes('ocean') || lowerName.includes('river') || lowerName.includes('thunder')) {
    return <Volume2 className="h-12 w-12 text-primary" />; // Using Volume2 as a generic water/rain icon
  }
  if (lowerName.includes('wind') || lowerName.includes('forest') || lowerName.includes('bird') || lowerName.includes('jungle') || lowerName.includes('desert')) {
    return <Volume2 className="h-12 w-12 text-primary" />; // Using Volume2 as a generic nature icon
  }
  if (lowerName.includes('cafe') || lowerName.includes('city') || lowerName.includes('train')) {
    return <Volume2 className="h-12 w-12 text-primary" />; // Using Volume2 as a generic urban icon
  }
  if (lowerName.includes('fire') || lowerName.includes('space') || lowerName.includes('zen') || lowerName.includes('ambiance')) {
    return <Volume2 className="h-12 w-12 text-primary" />; // Using Volume2 as a generic cozy icon
  }
  if (lowerName.includes('noise')) {
    return <Volume2 className="h-12 w-12 text-primary" />; // Using Volume2 as a generic noise icon
  }
  return <Music className="h-12 w-12 text-primary" />; // Default generic music icon
};


export function AmbientSoundItem({ name, url, isCurrentRoomWritable }: AmbientSoundItemProps) {
  const { isPlaying, volume, isMuted, togglePlayPause, setVolume, toggleMute } = useAmbientSound(url);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    togglePlayPause();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(parseFloat(e.target.value));
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    toggleMute();
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-between p-4 rounded-3xl shadow-lg transition-all duration-200 group aspect-square", // Added aspect-square for fixed ratio
        "bg-muted backdrop-blur-xl border border-border",
        isPlaying ? "ring-2 ring-primary" : "hover:border-primary/50", // Highlight when playing
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
    >
      {/* Icon and Name Area */}
      <div className="flex flex-col items-center justify-center flex-grow text-center">
        {getSoundIcon(name)}
        <span className="font-semibold text-base text-foreground mt-2 line-clamp-2">{name}</span>
      </div>

      {/* Controls Area */}
      <div className="flex flex-col items-center gap-2 w-full flex-shrink-0">
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full text-primary-foreground shadow-md hover:scale-105 transition-transform"
          onClick={handlePlayPause}
          disabled={!isCurrentRoomWritable}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'} {name}</span>
        </Button>
        <div className="flex items-center gap-1 w-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-muted/20"
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
              "w-full h-1 rounded-lg appearance-none cursor-pointer accent-primary",
              !isCurrentRoomWritable && "opacity-50 cursor-not-allowed"
            )}
            disabled={!isCurrentRoomWritable}
          />
        </div>
      </div>
    </div>
  );
}