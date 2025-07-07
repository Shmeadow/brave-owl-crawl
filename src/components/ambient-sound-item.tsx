"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAmbientSound } from "@/context/ambient-sound-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AmbientSoundItemProps {
  name: string;
  url: string;
  icon: React.ElementType;
  isCurrentRoomWritable: boolean;
}

export function AmbientSoundItem({ name, url, icon: Icon, isCurrentRoomWritable }: AmbientSoundItemProps) {
  const { soundsState, togglePlay, setVolume } = useAmbientSound();
  const soundState = soundsState.get(url) || { isPlaying: false, volume: 0.5 };
  const { isPlaying, volume } = soundState;

  const handlePlayPauseClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    togglePlay(url, name);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(url, value[0]);
  };

  return (
    <div
      className={cn(
        "flex flex-col p-3 rounded-lg border shadow-sm transition-all duration-200",
        isPlaying ? "bg-primary/20 border-primary" : "bg-card backdrop-blur-xl border-border hover:bg-muted/50",
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-md truncate text-foreground">{name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isPlaying ? "text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-accent"
          )}
          onClick={handlePlayPauseClick}
          disabled={!isCurrentRoomWritable}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="sr-only">{isPlaying ? `Pause ${name}` : `Play ${name}`}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.01}
          className="flex-grow"
          disabled={!isCurrentRoomWritable}
        />
      </div>
    </div>
  );
}