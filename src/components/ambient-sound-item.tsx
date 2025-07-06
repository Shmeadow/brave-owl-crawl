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
    return <Volume2 className="h-12 w-12 text-white" />;
  }
  if (lowerName.includes('wind') || lowerName.includes('forest') || lowerName.includes('bird') || lowerName.includes('jungle') || lowerName.includes('desert')) {
    return <Volume2 className="h-12 w-12 text-white" />;
  }
  if (lowerName.includes('cafe') || lowerName.includes('city') || lowerName.includes('train')) {
    return <Volume2 className="h-12 w-12 text-white" />;
  }
  if (lowerName.includes('fire') || lowerName.includes('space') || lowerName.includes('zen') || lowerName.includes('ambiance')) {
    return <Volume2 className="h-12 w-12 text-white" />;
  }
  if (lowerName.includes('noise')) {
    return <Volume2 className="h-12 w-12 text-white" />;
  }
  return <Music className="h-12 w-12 text-white" />;
};


export function AmbientSoundItem({ name, url, isCurrentRoomWritable }: AmbientSoundItemProps) {
  const { isPlaying, volume, isMuted, isBuffering, togglePlayPause, setVolume, toggleMute } = useAmbientSound(url);

  const handleInteraction = (e: React.MouseEvent) => {
    // Only allow interaction if writable
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    // If the click is on the main div or its direct children that don't have their own handlers
    // This ensures clicks on the volume slider/mute button don't trigger play/pause
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('flex-grow') || (e.target as HTMLElement).classList.contains('text-center')) {
      togglePlayPause();
    }
  };

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

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-between p-4 rounded-3xl shadow-lg transition-all duration-200 group aspect-square",
        "bg-transparent border-2 border-white/30", // Changed background and border
        isPlaying ? "bg-white/10 border-white/50" : "hover:bg-white/10 hover:border-white/50", // Active/hover state
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
      onClick={handleInteraction} // Handle play/pause on main div click
    >
      {/* Icon and Name Area */}
      <div className="flex flex-col items-center justify-center flex-grow text-center pointer-events-none"> {/* pointer-events-none to allow parent click */}
        {isBuffering && isPlaying ? (
          <Loader2 className="h-12 w-12 animate-spin text-white" /> // Spinner for buffering
        ) : (
          getSoundIcon(name)
        )}
        <span className="font-semibold text-base text-white mt-2 line-clamp-2">{name}</span> {/* Changed text-foreground to text-white */}
      </div>

      {/* Controls Area */}
      <div className="flex flex-col items-center gap-2 w-full flex-shrink-0 pointer-events-auto"> {/* Re-enable pointer events for controls */}
        {/* Play/Pause button is now just a visual indicator, main div handles click */}
        <Button
          variant="ghost" // Changed to ghost
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full text-white shadow-none transition-transform", // Changed text-primary-foreground to text-white, removed shadow
            "group-hover:scale-105", // Keep hover effect
            "pointer-events-none" // Make button non-interactive to allow parent click
          )}
          disabled={!isCurrentRoomWritable}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'} {name}</span>
        </Button>
        <div className="flex items-center gap-1 w-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20" // Changed text-muted-foreground to text-white, hover bg
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
              "w-full h-2 rounded-lg appearance-none cursor-pointer accent-white bg-gray-300", // Changed h-1 to h-2, accent-primary to accent-white, added bg-gray-300 for track
              !isCurrentRoomWritable && "opacity-50 cursor-not-allowed"
            )}
            disabled={!isCurrentRoomWritable}
          />
        </div>
      </div>
    </div>
  );
}