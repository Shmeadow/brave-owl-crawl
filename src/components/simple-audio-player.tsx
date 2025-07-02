"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, FastForward, Rewind, Music, Link, ChevronLeft, ChevronRight, Maximize, Minimize, ListMusic, Youtube } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl } from '@/lib/utils'; // Import utility functions
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY = 'simple_audio_player_display_mode';

const SimpleAudioPlayer = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [playerType, setPlayerType] = useState<'audio' | 'youtube' | 'spotify' | null>(null);
  const [currentTitle, setCurrentTitle] = useState('No Media Loaded');
  const [currentArtist, setCurrentArtist] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [displayMode, setDisplayMode] = useState<'normal' | 'maximized' | 'minimized'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY);
      // Default to 'normal' if no saved mode, or if saved mode is 'maximized' (which was the old default)
      // If saved mode is 'minimized', use 'minimized'.
      return savedMode === 'minimized' ? 'minimized' : 'normal';
    }
    return 'normal'; // Default for server-side render or initial client load
  });

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
    seekTo: youtubeSeekTo,
    playerReady: youtubePlayerReady,
    iframeId,
    youtubeCurrentTime,
    youtubeDuration,
  } = useYouTubePlayer(youtubeEmbedUrl);

  // Effect to save display mode to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY, displayMode);
    }
  }, [displayMode]);

  // Determine player type and set initial title/artist when inputUrl changes
  useEffect(() => {
    if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
      setPlayerType('youtube');
      setCurrentTitle('YouTube Video');
      setCurrentArtist('Unknown Artist');
    } else if (inputUrl.includes('open.spotify.com')) {
      setPlayerType('spotify');
      setCurrentTitle('Spotify Media');
      setCurrentArtist('Unknown Artist');
    } else if (inputUrl.match(/\.(mp3|wav|ogg|aac|flac)$/i)) {
      setPlayerType('audio');
      setCurrentTitle('Direct Audio');
      setCurrentArtist('Unknown Artist');
    } else {
      // Only set playerType to null, do not clear inputUrl here.
      // This prevents an unnecessary state update that might cause re-renders.
      setPlayerType(null);
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

  // Common functions for all players
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
    // Spotify embed has its own controls, no programmatic toggle here
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
      youtubeSeekTo(newTime);
    }
  };

  const skipForward = () => {
    if (playerType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, audioDuration);
      setAudioCurrentTime(audioRef.current.currentTime);
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime + 10);
    }
  };

  const skipBackward = () => {
    if (playerType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      setAudioCurrentTime(audioRef.current.currentTime);
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime - 10);
    }
  };

  const loadNewMedia = () => {
    setShowUrlInput(false);
  };

  const currentPlaybackTime = playerType === 'youtube' ? youtubeCurrentTime : audioCurrentTime;
  const totalDuration = playerType === 'youtube' ? youtubeDuration : audioDuration;
  const currentVolume = playerType === 'youtube' ? youtubeVolume / 100 : audioVolume;
  const currentIsPlaying = playerType === 'youtube' ? youtubeIsPlaying : audioIsPlaying;
  const currentIsMuted = playerType === 'youtube' ? youtubeVolume === 0 : audioIsMuted;
  const playerIsReady = playerType === 'youtube' ? youtubePlayerReady : true; // HTML audio is always ready, Spotify embed is also "ready" once loaded

  const spotifyEmbedUrl = playerType === 'spotify' ? getSpotifyEmbedUrl(inputUrl) : null;

  const PlayerIcon = playerType === 'youtube' ? Youtube : playerType === 'spotify' ? ListMusic : Music;

  // Determine player container classes based on displayMode
  const playerContainerClasses = cn(
    "fixed z-[1000] transition-all duration-300 ease-in-out",
    {
      'right-4 top-1/2 -translate-y-1/2 w-48 h-16': displayMode === 'minimized', // Minimized (docked)
      'top-20 right-4 w-80 h-auto': displayMode === 'normal', // Normal (top-right, fixed width)
      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-4xl w-full h-auto': displayMode === 'maximized', // Maximized (centered, larger)
    }
  );

  return (
    <>
      {/* Player Content (normal/maximized) */}
      {displayMode !== 'minimized' && (
        <div className={playerContainerClasses}>
          <div className="bg-card backdrop-blur-xl border-white/20 p-1 rounded-lg shadow-sm flex flex-col w-full h-full">
            {/* Conditional Audio/YouTube/Spotify Player */}
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
            {playerType === 'youtube' && youtubeEmbedUrl && (
              <div className="relative w-full aspect-video mb-1">
                <iframe
                  id={iframeId}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={youtubeEmbedUrl}
                  frameBorder="0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="YouTube video player"
                ></iframe>
              </div>
            )}
            {playerType === 'spotify' && spotifyEmbedUrl && (
              <div className="relative w-full aspect-square mb-1">
                <iframe
                  src={spotifyEmbedUrl}
                  width="100%"
                  height="100%"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-lg"
                  style={{ backgroundColor: 'transparent' }}
                  title="Spotify Embed"
                ></iframe>
              </div>
            )}

            {/* Main Player Row: Album Art, Track Info, Controls */}
            <div className="flex items-center justify-between space-x-1.5 mb-1">
              {/* Album Art Placeholder */}
              <div className="flex-shrink-0 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shadow-xs w-12 h-12">
                <PlayerIcon size={24} />
              </div>

              {/* Track Info and URL Input Toggle */}
              <div className="flex-grow min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentTitle}</p>
                <p className="text-xs text-muted-foreground truncate">{currentArtist}</p>
                <button
                  onClick={() => setShowUrlInput(prev => !prev)}
                  className="text-xs font-bold text-primary hover:underline mt-0.5 flex items-center"
                  title="Change Media URL"
                >
                  <Link size={12} className="mr-0.5" />
                  {showUrlInput ? 'Hide URL' : 'Embed URL'}
                </button>
              </div>

              {/* Playback Controls and Volume */}
              <div className="flex items-center space-x-0.5 flex-shrink-0">
                {playerType !== 'spotify' && (
                  <>
                    <button
                      onClick={skipBackward}
                      className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
                      aria-label="Skip backward 10 seconds"
                      title="Skip Backward"
                      disabled={!playerIsReady || playerType === 'spotify'}
                    >
                      <Rewind size={12} />
                    </button>
                    <button
                      onClick={togglePlayPause}
                      className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105"
                      aria-label={currentIsPlaying ? "Pause" : "Play"}
                      title={currentIsPlaying ? "Pause" : "Play"}
                      disabled={!playerIsReady || playerType === 'spotify'}
                    >
                      {currentIsPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={skipForward}
                      className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
                      aria-label="Skip forward 10 seconds"
                      title="Skip Forward"
                      disabled={!playerIsReady || playerType === 'spotify'}
                    >
                      <FastForward size={12} />
                    </button>
                  </>
                )}

                {/* Volume Control */}
                <div className="flex items-center space-x-0.5 ml-1">
                  <button
                    onClick={toggleMute}
                    className="p-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300"
                    aria-label={currentIsMuted ? "Unmute" : "Mute"}
                    title={currentIsMuted ? "Unmute" : "Mute"}
                    disabled={!playerIsReady || playerType === 'spotify'}
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
                    disabled={!playerIsReady || playerType === 'spotify'}
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
                disabled={!playerIsReady || totalDuration === 0 || playerType === 'spotify'}
              />
              <span className="text-xs text-muted-foreground w-8 text-left">{formatTime(totalDuration)}</span>
            </div>

            {/* URL Input Section */}
            {showUrlInput && (
              <div className="mt-1 p-1 bg-muted rounded-lg border border-border">
                <label htmlFor="media-url" className="block text-xs font-medium text-muted-foreground mb-0.5">
                  Embed URL:
                </label>
                <input
                  type="text"
                  id="media-url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="e.g., YouTube or Spotify link"
                  className="w-full p-0.5 text-xs border border-border rounded-md focus:ring-primary focus:border-primary mb-1 bg-background text-foreground placeholder-muted-foreground"
                />
                <button
                  onClick={loadNewMedia}
                  className="w-full bg-primary text-primary-foreground text-xs py-0.5 px-1 rounded-md hover:bg-primary/90 transition duration-300 shadow-xs"
                >
                  Load Media
                </button>
              </div>
            )}

            {/* Maximize/Minimize/Dock Internal Buttons */}
            <div className="flex justify-end mt-2 gap-1">
              {displayMode === 'normal' && (
                <button
                  onClick={() => setDisplayMode('maximized')}
                  className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
                  title="Maximize Player"
                >
                  <Maximize size={16} />
                </button>
              )}
              {displayMode === 'maximized' && (
                <button
                  onClick={() => setDisplayMode('normal')}
                  className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
                  title="Shrink Player"
                >
                  <Minimize size={16} />
                </button>
              )}
              <button
                onClick={() => setDisplayMode('minimized')}
                className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
                title="Minimize Player"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Minimized Player Content (only visible when displayMode is 'minimized') */}
      {displayMode === 'minimized' && (
        <div
          className={cn(
            "fixed z-[1000] p-1 rounded-lg shadow-sm flex items-center justify-between", // Horizontal layout
            "bg-card backdrop-blur-xl border-white/20",
            "right-4 top-1/2 -translate-y-1/2 w-48 h-16" // Docked at middle right
          )}
          title="Expand Player"
        >
          {/* Playback Controls */}
          <div className="flex items-center space-x-0.5 flex-shrink-0">
            {playerType !== 'spotify' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); skipBackward(); }}
                  className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
                  aria-label="Skip backward 10 seconds"
                  title="Skip Backward"
                  disabled={!playerIsReady || playerType === 'spotify'}
                >
                  <Rewind size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                  className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105"
                  aria-label={currentIsPlaying ? "Pause" : "Play"}
                  title={currentIsPlaying ? "Pause" : "Play"}
                  disabled={!playerIsReady || playerType === 'spotify'}
                >
                  {currentIsPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); skipForward(); }}
                  className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300"
                  aria-label="Skip forward 10 seconds"
                  title="Skip Forward"
                  disabled={!playerIsReady || playerType === 'spotify'}
                >
                  <FastForward size={12} />
                </button>
              </>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-0.5 ml-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className="p-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300"
              aria-label={currentIsMuted ? "Unmute" : "Mute"}
              title={currentIsMuted ? "Unmute" : "Mute"}
              disabled={!playerIsReady || playerType === 'spotify'}
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
              className="w-16 h-[0.15rem] rounded-lg appearance-none cursor-pointer accent-primary"
              style={{
                background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${currentVolume * 100}%, hsl(var(--muted)) ${currentVolume * 100}%, hsl(var(--muted)) 100%)`
              }}
              disabled={!playerIsReady || playerType === 'spotify'}
            />
          </div>

          {/* Expand Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setDisplayMode('normal'); }}
            className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 ml-1 flex-shrink-0"
            title="Expand Player"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </>
  );
};

export { SimpleAudioPlayer };