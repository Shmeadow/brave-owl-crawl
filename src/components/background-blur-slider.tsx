"use client";

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useBackgroundBlur } from '@/context/background-blur-provider';
import { Sun, Wind } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils'; // Import cn

interface BackgroundBlurSliderProps {
  className?: string; // Add className prop
}

export function BackgroundBlurSlider({ className }: BackgroundBlurSliderProps) {
  const { blur, setBlur } = useBackgroundBlur();

  return (
    <div className={cn("flex items-center gap-3 w-40 p-1.5", className)}> {/* Adjusted width, gap, and added padding */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Sun className="h-5 w-5 text-muted-foreground" /> {/* Increased icon size */}
          </TooltipTrigger>
          <TooltipContent>
            Clear
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Slider
        value={[blur]}
        min={0}
        max={16}
        step={1}
        onValueChange={(value) => setBlur(value[0])}
        title="Adjust Background Blur"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Wind className="h-5 w-5 text-muted-foreground" /> {/* Increased icon size */}
          </TooltipTrigger>
          <TooltipContent>
            Blurry
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}