"use client";  
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner"; // Ensure toast is imported

export default function useClientAudio(src: string) {
  // Create the Audio object once when the component mounts
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Track playing state
  const [volume, setVolumeState] = useState(0.5); // Default volume 0-1
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(volume); // To store volume before muting

  // Initialize audio element and attach event listeners once
  useEffect(() => {
    if (!audioRef.current) {
      console.log("[useClientAudio] Initializing new Audio element.");
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.loop = true; // Ensure ambient sounds loop
      audioRef.current.volume = volume; // Set initial volume
      audioRef.current.muted = isMuted; // Set initial mute state

      const audio = audioRef.current;

      const onError = (e: Event) => {
        console.error(`[useClientAudio] load error for ${audio.src}:`, e);
        toast.error(`Failed to load audio: ${audio.src.split('/').pop()}. Please ensure the file exists and is accessible.`);
        setIsPlaying(false); // Stop playing on error
      };
      const onPlay = () => {
        setIsPlaying(true);
        console.log(`[useClientAudio] Audio element reported 'play' event for: ${audio.src}`);
      };
      const onPause = () => {
        setIsPlaying(false);
        console.log(`[useClientAudio] Audio element reported 'pause' event for: ${audio.src}`);
      };
      const onEnded = () => setIsPlaying(false); // Also handle when loop ends (though loop is true)
      const onVolumeChange = () => { // Listen to native volume changes
        if (audioRef.current) {
          setVolumeState(audioRef.current.volume);
          setIsMuted(audioRef.current.muted || audioRef.current.volume === 0);
          console.log(`[useClientAudio] Volume changed to: ${audioRef.current.volume}, Muted: ${audioRef.current.muted}`);
        }
      };

      audio.addEventListener("error", onError);
      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("ended", onEnded);
      audio.addEventListener("volumechange", onVolumeChange); // New listener

      return () => {
        // Cleanup listeners when component unmounts
        audio.pause();
        audio.removeEventListener("error", onError);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("ended", onEnded);
        audio.removeEventListener("volumechange", onVolumeChange); // Remove listener
        // Do NOT nullify audioRef.current here, as it's a persistent ref for the hook instance.
      };
    }
  }, []); // Empty dependency array: runs only once on mount

  // Update src and load when src prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== src) {
      console.log(`[useClientAudio] Setting new source: ${src}`);
      audio.src = src;
      audio.load(); // Load the new source
      setIsPlaying(false); // Pause when source changes
    }
  }, [src]); // Dependency on src: runs when src prop changes

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.warn("[useClientAudio] Audio element not initialized.");
      return;
    }
    try {
      console.log(`[useClientAudio] Attempting to play audio: ${audio.src}`);
      await audio.play();
      console.log(`[useClientAudio] Play promise resolved for: ${audio.src}`);
      // isPlaying state will be updated by the 'play' event listener
    } catch (err: any) {
      console.error(`[useClientAudio] play error for ${audio.src}:`, err);
      if (err.name === "NotAllowedError") {
        toast.error("Autoplay blocked by browser. Please interact with the page to play audio.");
      } else {
        toast.error(`Failed to play audio: ${err.message || 'Unknown error'}.`);
      }
      setIsPlaying(false); // Ensure state is correct if play fails
    }
  }, []); // No dependencies needed as audioRef.current is stable

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      console.log(`[useClientAudio] Attempting to pause audio: ${audio.src}`);
      audio.pause();
      // isPlaying state will be updated by the 'pause' event listener
    }
  }, [isPlaying]);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = vol;
      setVolumeState(vol);
      if (vol > 0) {
        setIsMuted(false);
        prevVolumeRef.current = vol;
      } else {
        setIsMuted(true);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.muted = false;
        setVolumeState(prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.5);
      } else {
        prevVolumeRef.current = audio.volume;
        audio.muted = true;
        setVolumeState(0);
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  return { play, pause, isPlaying, volume, isMuted, setVolume, toggleMute };
}