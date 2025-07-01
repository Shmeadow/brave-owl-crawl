"use client";

import React from "react";
import { VolumeX, Volume2 } from "lucide-react";
import { useLofiAudio } from "@/hooks/use-lofi-audio"; // Import the new hook

interface LofiAudioPlayerProps {
  className?: string; // Allow external styling
}

export function LofiAudioPlayer({ className }: LofiAudioPlayerProps) {
  const { audioRef, isPlaying, togglePlayPause } = useLofiAudio();

  return (
    <div className={className}>
      <audio ref={audioRef} loop>
        <source src="/lofi-chill.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      {/* The button is now rendered externally, e.g., in ChatPanel */}
    </div>
  );
}