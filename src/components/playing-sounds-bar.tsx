"use client";

import React from 'react';
import { useAmbientSound } from '@/context/ambient-sound-provider';
import { allAmbientSounds } from '@/lib/sounds';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const soundMap = new Map(allAmbientSounds.map(sound => [sound.url, sound]));

interface PlayingSoundsBarProps {
  isMobile: boolean;
}

export function PlayingSoundsBar({ isMobile }: PlayingSoundsBarProps) {
  const { soundsState, togglePlay } = useAmbientSound();

  // Show all sounds that have been activated (playing or paused)
  const activeSounds = Array.from(soundsState.entries()).map(([url, state]) => {
    const soundDetails = soundMap.get(url);
    if (!soundDetails) return null;
    return {
      ...soundDetails,
      isPlaying: state.isPlaying,
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
                      onClick={() => togglePlay(sound.url, sound.name)}
                      className="relative flex items-center justify-center h-6 w-6 bg-primary/10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary overflow-hidden"
                      aria-label={`Toggle ${sound.name}`}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      {!sound.isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-px h-[141.4%] bg-red-500 transform -rotate-45"></div>
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{sound.name} ({sound.isPlaying ? 'Playing' : 'Paused'})</p>
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