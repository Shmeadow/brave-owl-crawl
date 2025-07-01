"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music, VolumeX, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LOCAL_STORAGE_AUDIO_PLAYING_KEY = 'lofi_audio_playing';

export function LofiAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedPlayingState = localStorage.getItem(LOCAL_STORAGE_AUDIO_PLAYING_KEY);
      if (savedPlayingState === 'true' && audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.warn("Autoplay prevented:", error);
          setIsPlaying(false);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_AUDIO_PLAYING_KEY, String(isPlaying));
    }
  }, [isPlaying, mounted]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        toast.info("Lofi audio paused.");
      } else {
        audioRef.current.play().then(() => {
          toast.success("Lofi audio playing!");
        }).catch(error => {
          toast.error("Failed to play audio. Browser autoplay policy might be blocking it.");
          console.error("Audio play error:", error);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        size="icon"
        className="rounded-full h-12 w-12 shadow-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-accent transition-all duration-200"
        onClick={togglePlayPause}
        title={isPlaying ? "Pause Lofi Audio" : "Play Lofi Audio"}
      >
        {isPlaying ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
        <span className="sr-only">{isPlaying ? "Pause Lofi Audio" : "Play Lofi Audio"}</span>
      </Button>
      <audio ref={audioRef} loop>
        <source src="/lofi-chill.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}