"use client";

import React, { useEffect } from "react"; // Import useEffect
import { Button } from "@/components/ui/button";
import { Play, Music, CloudRain, Wind, Coffee, Building, Waves, Sun, Snowflake, Keyboard, BookOpen, Volume2, Pause, VolumeX, Droplet, WavesIcon, TrainFront, Cloud, Leaf, Bird, Flame, Footprints, TreePine, Bug, Moon, Speaker } from "lucide-react"; // Import Pause icon, VolumeX, and more specific icons
import useClientAudio from "@/hooks/useClientAudio";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider"; // Import Slider

interface AmbientSoundItemProps {
  name: string;
  url: string;
  isCurrentRoomWritable: boolean;
  category: string; // Added category prop
}

// Helper function to get a more specific icon based on sound name/category
const getSoundIcon = (name: string, category: string) => {
  const lowerName = name.toLowerCase();
  const lowerCategory = category.toLowerCase();

  switch (lowerCategory) {
    case 'birds': return <Bird className="h-5 w-5 text-primary" />;
    case 'fire': return <Flame className="h-5 w-5 text-primary" />;
    case 'footsteps': return <Footprints className="h-5 w-5 text-primary" />;
    case 'forest': return <TreePine className="h-5 w-5 text-primary" />;
    case 'frogs': return <Bug className="h-5 w-5 text-primary" />; // Using Bug for frogs
    case 'leaves': return <Leaf className="h-5 w-5 text-primary" />;
    case 'night': return <Moon className="h-5 w-5 text-primary" />;
    case 'rain': return <Droplet className="h-5 w-5 text-primary" />;
    case 'cafe': return <Coffee className="h-5 w-5 text-primary" />;
    case 'river': return <WavesIcon className="h-5 w-5 text-primary" />;
    case 'weather': return <Cloud className="h-5 w-5 text-primary" />; // For thunder
    case 'city': return <TrainFront className="h-5 w-5 text-primary" />; // For trains
    case 'ocean': return <Waves className="h-5 w-5 text-primary" />;
    case 'wind': return <Wind className="h-5 w-5 text-primary" />;
    case 'noise': return <Speaker className="h-5 w-5 text-primary" />; // For white noise
    default: return <Music className="h-5 w-5 text-primary" />; // Default icon
  }
};


export function AmbientSoundItem({ name, url, isCurrentRoomWritable, category }: AmbientSoundItemProps) {
  const { isPlaying, volume, isMuted, togglePlayPause, setVolume, toggleMute } = useClientAudio(url);

  // Debugging log for isPlaying prop
  useEffect(() => {
    console.log(`[AmbientSoundItem] ${name} - isPlaying prop: ${isPlaying}`);
  }, [isPlaying, name]);

  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }

    togglePlayPause(); // Use the combined toggle function
    toast.info(isPlaying ? `Paused ${name}` : `Playing ${name}`);
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

  return (
    <div
      className={cn(
        "flex flex-col p-2 rounded-md border shadow-sm transition-all duration-200",
        isPlaying ? "bg-primary/20 border-primary" : "bg-card backdrop-blur-xl border-border hover:bg-muted/50", // More distinct playing state
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        {/* Icon and Name Area */}
        <div className="flex items-center gap-2 flex-grow min-w-0">
          {getSoundIcon(name, category)}
          <span className="font-medium text-sm truncate text-foreground">{name}</span>
        </div>

        {/* Play/Pause Button */}
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

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={handleToggleMute}
          disabled={!isCurrentRoomWritable}
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
          disabled={!isCurrentRoomWritable}
        />
      </div>
    </div>
  );
}