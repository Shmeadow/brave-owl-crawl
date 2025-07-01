"use client";

import React from "react";
// Removed VolumeX, Volume2 imports as they are no longer used here
// Removed useLofiAudio import as it's not needed for just the audio element

interface LofiAudioPlayerProps {
  className?: string; // Allow external styling
}

export function LofiAudioPlayer({ className }: LofiAudioPlayerProps) {
  // Removed useLofiAudio hook call as controls are now external

  return (
    <div className={className}>
      <audio id="lofi-audio-player" src="/lofi-chill.mp3" loop></audio>
    </div>
  );
}