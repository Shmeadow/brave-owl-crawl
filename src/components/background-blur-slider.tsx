"use client";

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useBackgroundBlur } from '@/context/background-blur-provider';
import { Sun, Wind } from 'lucide-react';

export function BackgroundBlurSlider() {
  const { blur, setBlur } = useBackgroundBlur();

  return (
    <div className="flex items-center gap-2 w-32">
      <Sun className="h-4 w-4 text-muted-foreground" title="Clear" />
      <Slider
        value={[blur]}
        min={0}
        max={16}
        step={1}
        onValueChange={(value) => setBlur(value[0])}
        title="Adjust Background Blur"
      />
      <Wind className="h-4 w-4 text-muted-foreground" title="Blurry" />
    </div>
  );
}