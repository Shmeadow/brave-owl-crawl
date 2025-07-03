"use client";

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { useGlassEffect } from '@/context/glass-effect-provider';
import { Sun, Snowflake } from 'lucide-react';

export function GlassEffectSlider() {
  const { glassiness, setGlassiness } = useGlassEffect();

  return (
    <div className="flex items-center gap-2 w-32">
      <Snowflake className="h-4 w-4 text-muted-foreground" title="More Opaque" />
      <Slider
        defaultValue={[glassiness]}
        min={0.1}
        max={1.0}
        step={0.05}
        onValueChange={(value) => setGlassiness(value[0])}
        title="Adjust Glass Effect"
      />
      <Sun className="h-4 w-4 text-muted-foreground" title="More Glassy" />
    </div>
  );
}