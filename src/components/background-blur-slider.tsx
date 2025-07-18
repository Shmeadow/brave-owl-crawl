"use client";

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useBackgroundBlur } from '@/context/background-blur-provider';
import { Sun, Wind } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils'; // Import cn

interface BackgroundBlurSliderProps {
  className?: string; // Add className prop
  isMobile?: boolean; // New prop
}

export function BackgroundBlurSlider({ className, isMobile }: BackgroundBlurSliderProps) {
  const { blur, setBlur } = useBackgroundBlur();

  // Only render the slider if it's not for mobile (i.e., desktop)
  // or if it's explicitly meant to be rendered on mobile (e.g., inside a dropdown)
  if (isMobile && !className?.includes('mobile-only')) {
    return null; // Don't render if it's the desktop version on mobile
  }

  return (
    <div className={cn(
      "flex items-center gap-2 w-32",
      !isMobile && "bg-card/60 backdrop-blur-xl border border-white/20 rounded-full p-1.5", // Apply styles only on desktop
      className
    )}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Sun className={cn("h-4 w-4 text-muted-foreground", !isMobile && "md:h-5 md:w-5")} />
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
            <Wind className={cn("h-4 w-4 text-muted-foreground", !isMobile && "md:h-5 md:w-5")} />
          </TooltipTrigger>
          <TooltipContent>
            Blurry
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}