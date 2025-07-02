"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface Track {
  src: string;
  title: string;
  artist: string;
  cover: string;
}

interface AudioPlayerProps {
  playlist: Track[];
  audioId?: string; // Optional ID for the audio element
}

// Helper to format time from seconds to MM:SS
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "--:--";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

const LOCAL_STORAGE_VOLUME_KEY = 'audio_player_volume';
const LOCAL_STORAGE_INDEX_KEY = 'audio_player_index';
const LOCAL_STORAGE_POSITION_KEY = 'audio_player_position';

export function AudioPlayer({ playlist, audioId = "lofiAudio" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLInputElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(0.6); // Default volume

  const currentTrack = useMemo(() => playlist[currentIndex], [playlist, currentIndex]);

  // Restore state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem(LOCAL_STORAGE_VOLUME_KEY);
      const savedIndex = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);
      const savedPosition = localStorage.getItem(LOCAL_STORAGE_POSITION_KEY);

      if (savedVolume !== null) {
        const vol = parseFloat(savedVolume);
        setVolumeState(vol);
        if (audioRef.current) {
          audioRef.current.volume = vol;
          audioRef.current.muted = vol === 0;
          setIsMuted(vol === 0);
        }
      }

      if (savedIndex !== null) {
        const index = parseInt(savedIndex, 10);
        if (index >= 0 && index < playlist.length) {
          setCurrentIndex(index);
        }
      }

      // Load track and set position after metadata is loaded
      const audio = audioRef.current;
      if (audio && savedPosition !== null) {
        const position = parseFloat(savedPosition);
        const handleLoadedMetadata = () => {
          audio.currentTime = position;
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      }
    }
  }, []); // Run once on mount

  // Load track when currentIndex changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentTrack) {
      audio.src = currentTrack.src;
      audio.load(); // Load the new track
      if (isPlaying) {
        audio.play().catch(e => console.error("Error playing audio:", e));
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_INDEX_KEY, String(currentIndex));
      }
    }
  }, [currentTrack, currentIndex]);

  // Event Listeners for audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => {
      setDuration(audio.duration);
      if (progressRef.current) {
        progressRef.current.max = String(audio.duration);
      }
    };

    const updateProgressUI = () => {
      setCurrentTime(audio.currentTime);
      if (progressRef.current) {
        progressRef.current.value = String(audio.currentTime);
      }
      // Throttle saving playback position
      if (typeof window !== 'undefined' && audio.currentTime % 5 < 1) { // Save every 5 seconds
        localStorage.setItem(LOCAL_STORAGE_POSITION_KEY, String(audio.currentTime));
      }
    };

    const handleEnded = () => {
      playTrack(currentIndex + 1);
    };

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('timeupdate', updateProgressUI);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('timeupdate', updateProgressUI);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentIndex, isPlaying]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        toast.info("Audio paused.");
      } else {
        audio.play().catch(e => {
          console.error("Error playing audio:", e);
          toast.error("Failed to play audio. Browser autoplay policy might be blocking it.");
        });
        toast.success("Audio playing.");
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const playTrack = useCallback((newIndex: number) => {
    const wrappedIndex = (newIndex + playlist.length) % playlist.length;
    setCurrentIndex(wrappedIndex);
    setIsPlaying(true); // Automatically play new track
    toast.info(`Now playing: ${playlist[wrappedIndex].title}`);
  }, [playlist]);

  const seekAudio = useCallback(() => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (audio && progress) {
      audio.currentTime = parseFloat(progress.value);
    }
  }, []);

  const setVolume = useCallback((value: number[]) => {
    const vol = value[0];
    const audio = audioRef.current;
    if (audio) {
      audio.volume = vol;
      setVolumeState(vol);
      setIsMuted(vol === 0);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_VOLUME_KEY, String(vol));
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !audio.muted;
      setIsMuted(audio.muted);
      // If unmuting and volume was 0, set to a default non-zero volume
      if (!audio.muted && audio.volume === 0) {
        audio.volume = 0.6; // Restore to a default if it was truly 0
        setVolumeState(0.6);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_VOLUME_KEY, String(0.6));
        }
      } else if (audio.muted) {
        // If muting, save current volume before setting to 0
        if (typeof window !== 'undefined') {
          localStorage.setItem(LOCAL_STORAGE_VOLUME_KEY, String(audio.volume));
        }
        setVolumeState(0);
      } else {
        // If unmuting and volume was not 0, just restore the volume state
        setVolumeState(audio.volume);
      }
    }
  }, []);

  if (!currentTrack) {
    return (
      <div className="audio-player">
        <p className="text-foreground">No audio tracks available.</p>
      </div>
    );
  }

  return (
    <div className="audio-player">
      <audio id={audioId} ref={audioRef} preload="metadata"></audio>

      <div className="player-cover">
        <img alt="Cover art" src={currentTrack.cover} className="transition-opacity duration-200" />
      </div>

      <div className="track-info">
        <div className="track-title transition-opacity duration-200">{currentTrack.title}</div>
        <div className="track-artist transition-opacity duration-200">{currentTrack.artist}</div>
      </div>

      <div className="controls">
        <Button
          className="btn prev"
          aria-label="Previous"
          onClick={() => playTrack(currentIndex - 1)}
          variant="ghost"
          size="icon"
        >
          <SkipBack className="h-5 w-5" />
        </Button>
        <Button
          className="btn play-pause"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={togglePlayPause}
          variant="ghost"
          size="icon"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button
          className="btn next"
          aria-label="Next"
          onClick={() => playTrack(currentIndex + 1)}
          variant="ghost"
          size="icon"
        >
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>

      <div className="progress-container">
        <span className="current-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="progress"
          min="0"
          max={duration}
          value={currentTime}
          onChange={seekAudio}
          ref={progressRef}
          aria-label="Audio progress"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={currentTime}
        />
        <span className="duration">{formatTime(duration)}</span>
      </div>

      <div className="volume-container">
        <Button
          className="btn mute"
          aria-label={isMuted ? "Unmute" : "Mute"}
          onClick={toggleMute}
          variant="ghost"
          size="icon"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </Button>
        <Slider
          value={[volume]}
          max={1}
          step={0.01}
          onValueChange={setVolume}
          className="volume"
          ref={volumeRef as any} // Cast to any because Slider expects a different ref type
          aria-label="Volume control"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={volume}
        />
      </div>
    </div>
  );
}