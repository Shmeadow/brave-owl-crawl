"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Music, Loader2, CloudRain, Wind, Coffee, Building, Waves, Sun, Snowflake, Keyboard, BookOpen, Volume2 } from "lucide-react";
import useClientAudio from "@/hooks/useClientAudio"; // Import the new hook
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  if (lowerCategory === 'nature') {
    if (lowerName.includes('rain') || lowerName.includes('thunderstorm') || lowerName.includes('thunder')) return <CloudRain className="h-5 w-5 text-primary" />;
    if (lowerName.includes('ocean') || lowerName.includes('beach') || lowerName.includes('river') || lowerName.includes('waves')) return <Waves className="h-5 w-5 text-primary" />;
    if (lowerName.includes('forest') || lowerName.includes('birds') || lowerName.includes('wind')) return <Wind className="h-5 w-5 text-primary" />;
  }
  if (lowerCategory === 'cafe') return <Coffee className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'city') return <Building className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'noise') return <Volume2 className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'music') return <Music className="h-5 w-5 text-primary" />;
  if (lowerCategory === 'abstract') {
    if (lowerName.includes('space')) return <Sun className="h-5 w-5 text-primary" />;
    if (lowerName.includes('zen')) return <Snowflake className="h-5 w-5 text-primary" />;
  }
  if (lowerCategory === 'productivity') {
    if (lowerName.includes('keyboard')) return <Keyboard className="h-5 w-5 text-primary" />;
    return <BookOpen className="h-5 w-5 text-primary" />; // Generic for productivity
  }
  return <Music className="h-5 w-5 text-primary" />; // Default icon
};


export function AmbientSoundItem({ name, url, isCurrentRoomWritable, category }: AmbientSoundItemProps) {
  const { play, isReady } = useClientAudio(url);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent click handlers
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      // console.log("[AmbientSoundItem] Blocked play: Room not writable."); // Removed for cleaner logs
      return;
    }
    // console.log(`[AmbientSoundItem] Attempting to play: ${name}. Ready: ${isReady}. Writable: ${isCurrentRoomWritable}`); // Removed for cleaner logs
    play();
    toast.info(`Playing ${name}`);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-2 rounded-md border border-border bg-card backdrop-blur-xl shadow-sm transition-all duration-200",
        isReady ? "bg-primary/10 border-primary" : "hover:bg-muted/50", // Indicate if ready
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
    >
      {/* Icon and Name Area */}
      <div className="flex items-center gap-2 flex-grow min-w-0">
        {!isReady ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          getSoundIcon(name, category)
        )}
        <span className="font-medium text-sm truncate text-foreground">{name}</span>
      </div>

      {/* Controls Area */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary"
          onClick={handlePlayClick}
          disabled={!isReady || !isCurrentRoomWritable}
        >
          <Play className="h-4 w-4" />
          <span className="sr-only">Play {name}</span>
        </Button>
      </div>
    </div>
  );
}