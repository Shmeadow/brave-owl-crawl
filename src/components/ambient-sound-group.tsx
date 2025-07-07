"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Music, CloudRain, Wind, Coffee, Building, Waves, Sun, Snowflake, Keyboard, BookOpen, Volume2, Pause, VolumeX, Droplet, WavesIcon, TrainFront, Cloud, Leaf, Bird, Flame, Footprints, TreePine, Bug, Moon, Speaker } from "lucide-react";
import useClientAudio from "@/hooks/useClientAudio";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

interface Sound {
  name: string;
  url: string;
}

interface AmbientSoundGroupProps {
  categoryName: string;
  sounds: Sound[];
  isCurrentRoomWritable: boolean;
}

// Helper function to get a more specific icon based on sound name/category
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();

  switch (lowerCategory) {
    case 'birds': return <Bird className="h-5 w-5 text-primary" />;
    case 'fire': return <Flame className="h-5 w-5 text-primary" />;
    case 'footsteps': return <Footprints className="h-5 w-5 text-primary" />;
    case 'forest': return <TreePine className="h-5 w-5 text-primary" />;
    case 'frogs': return <Bug className="h-5 w-5 text-primary" />;
    case 'leaves': return <Leaf className="h-5 w-5 text-primary" />;
    case 'night': return <Moon className="h-5 w-5 text-primary" />;
    case 'rain': return <Droplet className="h-5 w-5 text-primary" />;
    case 'cafe': return <Coffee className="h-5 w-5 text-primary" />;
    case 'river': return <WavesIcon className="h-5 w-5 text-primary" />;
    case 'weather': return <Cloud className="h-5 w-5 text-primary" />;
    case 'city': return <TrainFront className="h-5 w-5 text-primary" />;
    case 'ocean': return <Waves className="h-5 w-5 text-primary" />;
    case 'wind': return <Wind className="h-5 w-5 text-primary" />;
    case 'noise': return <Speaker className="h-5 w-5 text-primary" />;
    default: return <Music className="h-5 w-5 text-primary" />;
  }
};

export function AmbientSoundGroup({ categoryName, sounds, isCurrentRoomWritable }: AmbientSoundGroupProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSound = sounds[activeIndex];

  const { isPlaying, volume, isMuted, togglePlayPause, setVolume, toggleMute, isReady } = useClientAudio(activeSound.url);

  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    if (!isReady) {
      toast.info("Audio is still loading, please wait...");
      return;
    }
    togglePlayPause();
    toast.info(isPlaying ? `Paused ${activeSound.name}` : `Playing ${activeSound.name}`);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(value[0]);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    toggleMute();
  };

  const handleSoundVariationClick = (index: number) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
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
          {getCategoryIcon(categoryName)}
          <span className="font-semibold text-md truncate text-foreground">{activeSound.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8",
            isPlaying ? "text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-accent"
          )}
          onClick={handlePlayPauseClick}
          disabled={!isCurrentRoomWritable || !isReady}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="sr-only">{isPlaying ? `Pause ${activeSound.name}` : `Play ${activeSound.name}`}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={handleToggleMute}
          disabled={!isCurrentRoomWritable || !isReady}
        >
          {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          <span className="sr-only">{isMuted ? "Unmute" : "Mute"}</span>
        </Button>
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.01}
          className="flex-grow"
          disabled={!isCurrentRoomWritable || !isReady}
        />
      </div>

      {sounds.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {sounds.map((sound, index) => (
            <Button
              key={sound.url}
              variant={activeIndex === index ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleSoundVariationClick(index)}
              disabled={!isCurrentRoomWritable}
            >
              {sound.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}