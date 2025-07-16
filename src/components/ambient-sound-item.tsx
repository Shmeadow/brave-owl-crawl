"use client";

import React from "react";
import { Slider } from "@/components/ui/slider";
import { useAmbientSound } from "@/context/ambient-sound-provider";
import { cn } from "@/lib/utils";
import { toast } from '@/context/toast-visibility-provider'; // Updated toast import

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

  const handleContainerClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    togglePlay(url, name);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!isCurrentRoomWritable) {
      return;
    }
    setVolume(url, value[0]);
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-2 rounded-lg border cursor-pointer transition-all duration-200 space-y-2 h-24",
        isPlaying ? "bg-primary/20 border-primary shadow-md" : "bg-card/60 backdrop-blur-xl border-border hover:bg-muted/80",
        !isCurrentRoomWritable && "opacity-60 cursor-not-allowed"
      )}
      onClick={handleContainerClick}
      title={name}
    >
      <Icon className={cn("h-6 w-6", isPlaying ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
      <span className="text-xs text-center font-medium truncate w-full">{name}</span>
      
      <div
        className={cn(
          "absolute bottom-1 left-1 right-1 transition-opacity duration-200",
          isPlaying ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()} // Prevent slider click from toggling play/pause
      >
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.01}
          className="w-full h-4"
          disabled={!isCurrentRoomWritable || !isPlaying}
        />
      </div>
    </div>
  );
}