"use client";

import React from "react";

interface LofiAudioPlayerProps {
  className?: string; // Allow external styling
}

export function LofiAudioPlayer({ className }: LofiAudioPlayerProps) {
  return (
    <div className={className}>
      <audio id="lofi-audio-player" src="/lofi-chill.mp3" loop></audio>
    </div>
  );
}