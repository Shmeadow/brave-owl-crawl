"use client";  
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner"; // Ensure toast is imported

export default function useClientAudio(src: string) {
  // Create the Audio object once when the component mounts
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Track playing state

  // Initialize audio element and attach event listeners once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.loop = true; // Ensure ambient sounds loop

      const audio = audioRef.current;

      const onCanPlay = () => {
        setIsReady(true);
      };
      const onError = (e: Event) => {
        console.error(`[useClientAudio] load error for ${audio.src}`, e);
        toast.error(`Failed to load audio: ${audio.src.split('/').pop()}.`);
        setIsReady(false);
        setIsPlaying(false); // Stop playing on error
      };
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => setIsPlaying(false); // Also handle when loop ends (though loop is true)

      audio.addEventListener("canplaythrough", onCanPlay);
      audio.addEventListener("error", onError);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("ended", onEnded);

      return () => {
        // Cleanup listeners when component unmounts
        audio.pause();
        audio.removeEventListener("canplaythrough", onCanPlay);
        audio.removeEventListener("error", onError);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("ended", onEnded);
        // Do NOT nullify audioRef.current here, as it's a persistent ref for the hook instance.
      };
    }
  }, []); // Empty dependency array: runs only once on mount

  // Update src and load when src prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== src) {
      audio.src = src;
      audio.load(); // Load the new source
      setIsReady(false); // Reset ready state when source changes
      setIsPlaying(false); // Pause when source changes
    }
  }, [src]); // Dependency on src: runs when src prop changes

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.warn("[useClientAudio] Audio element not initialized.");
      return;
    }
    if (!isReady) {
      console.warn(`[useClientAudio] Audio not ready yet for ${audio.src}. Attempting to play anyway.`);
      // Attempt to play even if not 'canplaythrough' yet, as some browsers might allow it.
      // The 'play' promise will resolve/reject based on actual readiness.
    }
    try {
      await audio.play();
      // setIsPlaying(true); // State updated by 'play' event listener
    } catch (err: any) {
      console.error(`[useClientAudio] play error for ${audio.src}:`, err);
      if (err.name === "NotAllowedError") {
        toast.error("Autoplay blocked by browser. Please interact with the page to play audio.");
      } else {
        toast.error(`Failed to play audio: ${err.message || 'Unknown error'}.`);
      }
      setIsPlaying(false); // Ensure state is correct if play fails
    }
  }, [isReady]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      audio.pause();
      // setIsPlaying(false); // State updated by 'pause' event listener
    }
  }, [isPlaying]);

  return { play, pause, isReady, isPlaying };
}