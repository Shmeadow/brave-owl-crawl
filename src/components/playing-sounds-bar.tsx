"use client";

import React from 'react';
import { useAmbientSound } from '@/context/ambient-sound-provider';
import { allAmbientSounds } from '@/lib/sounds';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX } from 'lucide-react'; // Import mute/unmute icons

const soundMap = new Map(allAmbientSounds.map(sound => [sound.url, sound]));

interface PlayingSoundsBarProps {
  isMobile: boolean;
}

export function PlayingSoundsBar({ isMobile }: PlayingSoundsBarProps) {
  const { soundsState, toggleMute } = useAmbientSound(); // Use toggleMute

  // Show only sounds that are currently playing.
  const activeSounds = Array.from(soundsState.entries())
    .filter(([_, state]) => state.isPlaying)
    .map(([url, state]) => {
      const soundDetails = soundMap.get(url);
      if (!soundDetails) return null;
      return {
        ...soundDetails,
        isPlaying: state.isPlaying,
        isMuted: state.isMuted, // Pass muted state
      };
    }).filter(Boolean);

  if (activeSounds.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed left-1/2 -translate-x-1/2 z-[902] pointer-events-none",
      isMobile ? "bottom-40" : "top-20"
    )}>
      <Card className="bg-background/60 backdrop-blur-xl border-white/20 shadow-lg rounded-full p-1.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            {activeSounds.map((sound) => {
              if (!sound) return null;
              const Icon = sound.icon;
              return (
                <Tooltip key={sound.url}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleMute(sound.url, sound.name)} // Call toggleMute
                      className="relative flex items-center justify-center h-6 w-6 bg-primary/10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary overflow-hidden"
                      aria-label={sound.isMuted ? `Unmute ${sound.name}` : `Mute ${sound.name}`}
                    >
                      <Icon className={cn("h-4 w-4", sound.isMuted ? "text-muted-foreground" : "text-primary")} />
                      {sound.isMuted && (
                        <VolumeX className="absolute h-3 w-3 text-muted-foreground" /> // Mute icon overlay
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{sound.isMuted ? `Unmute ${sound.name}` : `Mute ${sound.name}`}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </Card>
    </div>
  );
}