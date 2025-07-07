"use client";  
import { useEffect, useRef, useState, useCallback } from "react";

export default function useClientAudio(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null); // Initialize with null
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Create Audio object only once per component instance
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.loop = true; // Ensure ambient sounds loop
    }

    const audio = audioRef.current;
    if (!audio) return; // Should not happen if initialized above

    // Set src and load when src changes
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
      setIsReady(false); // Reset ready state when source changes
    }

    const onCanPlay = () => setIsReady(true);
    const onError   = (e: Event) => {
      console.error(`[useClientAudio] load error for ${audio.src}`, e);
      setIsReady(false);
    };

    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("error", onError);

    return () => {
      // Clean up listeners & audio
      audio.pause();
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("error", onError);
      // Do not nullify audioRef.current here, as it's a persistent ref for the hook instance.
    };
  }, [src]); // Depend on src to re-run when the audio source changes

  const play = useCallback(async () => {
    if (!isReady) return console.warn("Audio not ready yet");
    try {
      await audioRef.current!.play();
    } catch (err) {
      console.error(`[useClientAudio] play error for ${audioRef.current!.src}`, err);
    }
  }, [isReady]);

  return { play, isReady };
}