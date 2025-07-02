"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind, Music, Link } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { getYouTubeEmbedUrl, getYouTubeVideoId } from '@/lib/utils'; // Import utility functions

const SimpleAudioPlayer = () => {
  const [inputUrl, setInputUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  const [playerType, setPlayerType] = useState<'audio' | 'youtube' | null>(null);
  const [currentTitle, setCurrentTitle] = useState('SoundHelix Song 1');
  const [currentArtist, setCurrentArtist] = useState('SoundHelix');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // State for HTML Audio Player
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [audioIsMuted, setAudioIsMuted] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const prevAudioVolumeRef = useRef(audioVolume);

  // State for YouTube Player
  const youtubeEmbedUrl = playerType === 'youtube' ? getYouTubeEmbedUrl(inputUrl) : null;
  const {
    isPlaying: youtubeIsPlaying,
    volume: youtubeVolume,
    togglePlayPause: youtubeTogglePlayPause,
    setVolume: youtubeSetVolume,
    playerReady: youtubePlayerReady,
    iframeId,
    youtubeCurrentTime,
    youtubeDuration,
  } = useYouTubePlayer(youtubeEmbedUrl);

  // Determine player type and set initial title/artist when inputUrl changes
  useEffect(() => {
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      setPlayerType('youtube');
      setCurrentTitle('YouTube Video');
      setCurrentArtist('Unknown Artist'); // Cannot easily get from client-side YouTube API without key
    } else if (inputUrl.match(/\.(mp3|wav|ogg|aac|flac)$/i)) {
      setPlayerType('audio');
      setCurrentTitle('Direct Audio');
      setCurrentArtist('Unknown Artist'); // Cannot easily get from client-side
    } else {
      setPlayerType(null); // Invalid or unsupported URL
      setCurrentTitle('No Media Loaded');
      setCurrentArtist('');
    }
  }, [inputUrl]);

  // Sync play/pause state for HTML Audio
  useEffect(() => {
    if (playerType === 'audio' && audioRef.current) {
      if (audioIsPlaying) {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioIsPlaying, playerType]);

  // Sync volume/mute state for HTML Audio
  useEffect(() => {
    if (playerType === 'audio' && audioRef.current) {
      audioRef.current.volume = audioIsMuted ? 0 : audioVolume;
    }
  }, [audioVolume, audioIsMuted, playerType]);

  // HTML Audio Event Handlers
  const onLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const onEnded = useCallback(() => {
    setAudioIsPlaying(false);
    setAudioCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Common functions for both players
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (playerType === 'audio') {
      setAudioIsPlaying(prev => !prev);
    } else if (playerType === 'youtube') {
      youtubeTogglePlayPause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (playerType === 'audio') {
      setAudioVolume(newVolume);
      if (newVolume > 0) {
        setAudioIsMuted(false);
        prevAudioVolumeRef.current = newVolume;
      } else {
        setAudioIsMuted(true);
      }
    } else if (playerType === 'youtube') {
      youtubeSetVolume(newVolume * 100); // YouTube API uses 0-100
    }
  };

  const toggleMute = () => {
    if (playerType === 'audio') {
      if (audioIsMuted) {
        setAudioVolume(prevAudioVolumeRef.current > 0 ? prevAudioVolumeRef.current : 0.7);
        setAudioIsMuted(false);
      } else {
        prevAudioVolumeRef.current = audioVolume;
        setAudioVolume(0);
        setAudioIsMuted(true);
      }
    } else if (playerType === 'youtube') {
      // YouTube API doesn't have a direct mute toggle, set volume to 0 or previous
      if (youtubeVolume === 0) {
        youtubeSetVolume(prevAudioVolumeRef.current * 100); // Use stored volume
      } else {
        prevAudioVolumeRef.current = youtubeVolume / 100; // Store current volume
        youtubeSetVolume(0);
      }
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (playerType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      // YouTube player seekTo expects seconds
      playerRef.current?.seekTo(newTime, true);
      // setYoutubeCurrentTime(newTime); // Will be updated by interval
    }
  };

  const skipForward = () => {
    if (playerType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioDuration);
      setAudioCurrentTime(audioRef.current.currentTime);
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      playerRef.current?.seekTo(youtubeCurrentTime + 10, true);
    }
  };

  const skipBackward = () => {
    if (playerType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      setAudioCurrentTime(audioRef.current.currentTime);
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      playerRef.current?.seekTo(youtubeCurrentTime - 10, true);
    }
  };

  const loadNewAudio = () => {
    setShowUrlInput(false);
    // Player type and title/artist will be updated by the useEffect when inputUrl changes
  };

  const currentPlaybackTime = playerType === 'youtube' ? youtubeCurrentTime : audioCurrentTime;
  const totalDuration = playerType === 'youtube' ? youtubeDuration : audioDuration;
  const currentVolume = playerType === 'youtube' ? youtubeVolume / 100 : audioVolume;
  const currentIsPlaying = playerType === 'youtube' ? youtubeIsPlaying : audioIsPlaying;
  const currentIsMuted = playerType === 'youtube' ? youtubeVolume === 0 : audioIsMuted;
  const playerIsReady = playerType === 'youtube' ? youtubePlayerReady : true; // HTML audio is always ready

  return (
    <div className="fixed right-4 z-[1000] top-20">
      <div className="bg-card backdrop-blur-xl border-white/20 p-1 rounded-lg shadow-sm max-w-[16rem] w-full">

        {/* Conditional Audio/YouTube Player */}
        {playerType === 'audio' && (
          <audio
            ref={audioRef}
            src={inputUrl}
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
        )}
        {playerType === 'youtube' && (
          <div className="relative w-full aspect-video mb-1">
            <iframe
              id={iframeId}
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={youtubeEmbedUrl || ""}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube video player"
            ></iframe>
          </div>
        )}

        {/* Main Player Row: Album Art, Track Info, Controls */}
        <div className="flex items-center justify-between space-x-1.5 mb-1">
          {/* Album Art Placeholder */}
          <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shadow-xs">
            <Music size={24} />
          </div>

          {/* Track Info and URL Input Toggle */}
          <div className="flex-grow min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentTitle}</p>
            <p className="text-xs text-muted-foreground truncate">{currentArtist}</p>
            <button
              onClick={() => setShowUrlInput(prev => !prev)}
              className="text-xs font-bold text-primary hover:underline mt-0.5 flex items-center"
              title="Change Music URL"
            >
              <Link size={12} className="mr-0.5" />
              {showUrlInput ? 'Hide URL' : 'Embed URL'}
            </button>
          </div>

          {/* Playback Controls and Volume */}
          <div className="flex items-center space-x-0.5 flex-shrink-0">
            <button
              onClick={skipBackward}
              className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
              aria-label="Skip backward 10 seconds"
              title="Skip Backward"
              disabled={!playerIsReady}
            >
              <Rewind size={12} />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105"
              aria-label={currentIsPlaying ? "Pause" : "Play"}
              title={currentIsPlaying ? "Pause" : "Play"}
              disabled={!playerIsReady}
            >
              {currentIsPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              onClick={skipForward}
              className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
              aria-label="Skip forward 10 seconds"
              title="Skip Forward"
              disabled={!playerIsReady}
            >
              <FastForward size={12} />
            </button>

            {/* Volume Control */}
            <div className="flex items-center space-x-0.5 ml-1">
              <button
                onClick={toggleMute}
                className="p-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300"
                aria-label={currentIsMuted ? "Unmute" : "Mute"}
                title={currentIsMuted ? "Unmute" : "Mute"}
                disabled={!playerIsReady}
              >
                {currentIsMuted || currentVolume === 0 ? <VolumeX size={10} /> : <Volume2 size={10} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={currentVolume}
                onChange={handleVolumeChange}
                className="w-8 h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${currentVolume * 100}%, hsl(var(--muted)) ${currentVolume * 100}%, hsl(var(--muted)) 100%)`
                }}
                disabled={!playerIsReady}
              />
            </div>
          </div>
        </div>

        {/* Progress Bar and Time */}
        <div className="flex items-center space-x-1 mb-1">
          <span className="text-xs text-muted-foreground w-8 text-right">{formatTime(currentPlaybackTime)}</span>
          <input
            type="range"
            min="0"
            max={totalDuration || 0}
            value={currentPlaybackTime}
            onChange={handleProgressBarChange}
            className="w-full h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(currentPlaybackTime / totalDuration) * 100}%, hsl(var(--muted)) ${(currentPlaybackTime / totalDuration) * 100}%, hsl(var(--muted)) 100%)`
            }}
            disabled={!playerIsReady || totalDuration === 0}
          />
          <span className="text-xs text-muted-foreground w-8 text-left">{formatTime(totalDuration)}</span>
        </div>

        {/* URL Input Section */}
        {showUrlInput && (
          <div className="mt-1 p-1 bg-muted rounded-lg border border-border">
            <label htmlFor="audio-url" className="block text-xs font-medium text-muted-foreground mb-0.5">
              Embed URL:
            </label>
            <input
              type="text"
              id="audio-url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              className="w-full p-0.5 text-xs border border-border rounded-md focus:ring-primary focus:border-primary mb-1 bg-background text-foreground placeholder-muted-foreground"
            />
            <button
              onClick={loadNewAudio}
              className="w-full bg-primary text-primary-foreground text-xs py-0.5 px-1 rounded-md hover:bg-primary/90 transition duration-300 shadow-xs"
            >
              Load Media
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export { SimpleAudioPlayer };