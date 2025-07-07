"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Music, Bird, Flame, Footprints, Leaf, Droplet, WavesIcon, TrainFront, Cloud, TreePine, Bug, Moon, Speaker, Wind, Coffee } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAmbientSound } from "@/context/ambient-sound-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Sound {
  name: string;
  url: string;
}

interface AmbientSoundGroupProps {
  categoryName: string;
  sounds: Sound[];
  isCurrentRoomWritable: boolean;
}

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
      case 'ocean': return <WavesIcon className="h-5 w-5 text-primary" />;
      case 'wind': return <Wind className="h-5 w-5 text-primary" />;
      case 'noise': return <Speaker className="h-5 w-5 text-primary" />;
      default: return <Music className="h-5 w-5 text-primary" />;
    }
};

export function AmbientSoundGroup({ categoryName, sounds, isCurrentRoomWritable }: AmbientSoundGroupProps) {
  const { groupsState, togglePlay, setVolume, setActiveSound } = useAmbientSound();
  
  const groupState = groupsState.get(categoryName) || {
    isPlaying: false,
    volume: 0.5,
    activeSoundUrl: sounds[0].url,
  };

  const activeSound = sounds.find(s => s.url === groupState.activeSoundUrl) || sounds[0];

  const handlePlayPauseClick = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    togglePlay(categoryName, activeSound.url);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(categoryName, value[0]);
  };

  const handleSoundVariationClick = (soundUrl: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to change sounds in this room.");
      return;
    }
    setActiveSound(categoryName, soundUrl);
  };

  return (
    <div
      className={cn(
        "flex flex-col p-3 rounded-lg border shadow-sm transition-all duration-200",
        groupState.isPlaying ? "bg-primary/20 border-primary" : "bg-card backdrop-blur-xl border-border hover:bg-muted/50",
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
            groupState.isPlaying ? "text-primary hover:bg-primary/20" : "text-muted-foreground hover:bg-accent"
          )}
          onClick={handlePlayPauseClick}
          disabled={!isCurrentRoomWritable}
        >
          {groupState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span className="sr-only">{groupState.isPlaying ? `Pause ${categoryName}` : `Play ${categoryName}`}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider
          value={[groupState.volume]}
          onValueChange={handleVolumeChange}
          max={1}
          step={0.01}
          className="flex-grow"
          disabled={!isCurrentRoomWritable}
        />
      </div>

      {sounds.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {sounds.map((sound) => (
            <Button
              key={sound.url}
              variant={groupState.activeSoundUrl === sound.url ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handleSoundVariationClick(sound.url)}
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