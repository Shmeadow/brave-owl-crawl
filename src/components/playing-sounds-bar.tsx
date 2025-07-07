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
  const { soundsState } = useAmbientSound();

  const playingSounds = Array.from(soundsState.entries())
    .filter(([_, state]) => state.isPlaying)
    .map(([url, _]) => soundMap.get(url))
    .filter(Boolean);

  if (playingSounds.length === 0) {
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
            {playingSounds.map((sound) => {
              const Icon = sound!.icon;
              return (
                <Tooltip key={sound!.url}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center h-6 w-6 bg-primary/10 rounded-full">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{sound!.name}</p>
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