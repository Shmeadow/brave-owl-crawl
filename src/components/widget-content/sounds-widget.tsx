"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAmbientPlayer } from "@/hooks/use-ambient-player"; // Import the new hook
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

// Placeholder list for 31 sounds. Replace with your actual sound file names and paths.
const allAmbientSounds = [
  { name: "Rain Gutter", url: "/sounds/rain.mp3" },
  { name: "Forest Birds", url: "/sounds/forest.mp3" },
  { name: "Ocean Waves", url: "/sounds/ocean.mp3" },
  { name: "Crackling Fireplace", url: "/sounds/fireplace.mp3" },
  { name: "Busy Cafe", url: "/sounds/cafe.mp3" },
  { name: "Distant Thunder", url: "/sounds/thunder.mp3" },
  { name: "Gentle Wind", url: "/sounds/wind.mp3" },
  { name: "Flowing River", url: "/sounds/river.mp3" },
  { name: "City Ambience", url: "/sounds/city_ambience.mp3" },
  { name: "White Noise", url: "/sounds/white_noise.ogg" },
  { name: "Sound 11", url: "/sounds/sound11.mp3" },
  { name: "Sound 12", url: "/sounds/sound12.mp3" },
  { name: "Sound 13", url: "/sounds/sound13.mp3" },
  { name: "Sound 14", url: "/sounds/sound14.mp3" },
  { name: "Sound 15", url: "/sounds/sound15.mp3" },
  { name: "Sound 16", url: "/sounds/sound16.mp3" },
  { name: "Sound 17", url: "/sounds/sound17.mp3" },
  { name: "Sound 18", url: "/sounds/sound18.mp3" },
  { name: "Sound 19", url: "/sounds/sound19.mp3" },
  { name: "Sound 20", url: "/sounds/sound20.mp3" },
  { name: "Sound 21", url: "/sounds/sound21.mp3" },
  { name: "Sound 22", url: "/sounds/sound22.mp3" },
  { name: "Sound 23", url: "/sounds/sound23.mp3" },
  { name: "Sound 24", url: "/sounds/sound24.mp3" },
  { name: "Sound 25", url: "/sounds/sound25.mp3" },
  { name: "Sound 26", url: "/sounds/sound26.mp3" },
  { name: "Sound 27", url: "/sounds/sound27.mp3" },
  { name: "Sound 28", url: "/sounds/sound28.mp3" },
  { name: "Sound 29", url: "/sounds/sound29.mp3" },
  { name: "Sound 30", url: "/sounds/sound30.mp3" },
  { name: "Sound 31", url: "/sounds/sound31.mp3" },
];

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  const {
    currentSoundUrl,
    isPlaying,
    volume,
    isMuted,
    loadAndPlay,
    togglePlayPause,
    setVolume,
    toggleMute,
  } = useAmbientPlayer();

  const handleSoundClick = (soundUrl: string) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    if (currentSoundUrl === soundUrl && isPlaying) {
      togglePlayPause(); // Pause if already playing this sound
    } else {
      loadAndPlay(soundUrl); // Load and play the new sound
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    setVolume(parseFloat(e.target.value));
  };

  const handleToggleMute = () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to control sounds in this room.");
      return;
    }
    toggleMute();
  };

  const currentSoundName = allAmbientSounds.find(s => s.url === currentSoundUrl)?.name || "No Sound Selected";

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4">
      <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" /> Ambient Sounds
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground truncate pr-2">
              Now Playing: {currentSoundName}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={togglePlayPause}
                disabled={!isCurrentRoomWritable || !currentSoundUrl}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleMute}
                disabled={!isCurrentRoomWritable || !currentSoundUrl}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className={cn(
                  "w-20 h-1 rounded-lg appearance-none cursor-pointer accent-primary",
                  (!isCurrentRoomWritable || !currentSoundUrl) && "opacity-50 cursor-not-allowed"
                )}
                disabled={!isCurrentRoomWritable || !currentSoundUrl}
              />
            </div>
          </div>

          {allAmbientSounds.length === 0 ? (
            <p className="p-4 text-muted-foreground text-sm text-center">No ambient sounds available.</p>
          ) : (
            <ScrollArea className="flex-1 h-full">
              <div className="p-4 space-y-2">
                {allAmbientSounds.map((sound) => (
                  <Button
                    key={sound.url}
                    variant={currentSoundUrl === sound.url && isPlaying ? "default" : "outline"}
                    className={cn(
                      "w-full justify-start text-left",
                      currentSoundUrl === sound.url && isPlaying ? "" : "bg-muted hover:bg-accent",
                      !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
                    )}
                    onClick={() => handleSoundClick(sound.url)}
                    disabled={!isCurrentRoomWritable}
                  >
                    {sound.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
          <p className="text-sm text-muted-foreground mt-4 p-4 text-center border-t border-border">
            Select a sound to play. Only one ambient sound can play at a time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}