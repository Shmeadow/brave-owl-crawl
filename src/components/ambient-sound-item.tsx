"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useAmbientSound } from "@/hooks/use-ambient-sound";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AmbientSoundItemProps {
  name: string;
  url: string;
  isCurrentRoomWritable: boolean;
}

export function AmbientSoundItem({ name, url, isCurrentRoomWritable }: AmbientSoundItemProps) {
  const { isPlaying, volume, isMuted, togglePlayPause, setVolume, toggleMute } = useAmbientSound(url);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click if it becomes a button
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    togglePlayPause();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent triggering parent click
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(parseFloat(e.target.value));
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    toggleMute();
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-3 rounded-lg shadow-sm transition-all duration-200 group",
        "bg-muted backdrop-blur-xl border border-border",
        isPlaying ? "ring-2 ring-primary" : "",
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
    >
      <span className="font-semibold text-sm text-foreground mb-2 text-center w-full px-1">{name}</span>
      <div className="flex items-center gap-2 w-full justify-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-primary hover:bg-primary/10"
          onClick={handlePlayPause}
          disabled={!isCurrentRoomWritable}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'} {name}</span>
        </Button>
        <div className="flex items-center gap-1 flex-1 min-w-0">
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