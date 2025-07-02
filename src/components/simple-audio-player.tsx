"use client";

import React, { useState, useEffect } from 'react';
import { Music, ListMusic, Youtube } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player'; // New hook
import { cn } from '@/lib/utils';

// Import new modular components
import { PlayerDisplay } from './audio-player/player-display';
import { MediaInput } from './audio-player/media-input';
import { PlayerControls } from './audio-player/player-controls';
import { ProgressBar } from './audio-player/progress-bar';
import { PlayerModeButtons } from './audio-player/player-mode-buttons';

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
      return savedMode === 'minimized' ? 'minimized' : 'normal';
    }
    return 'normal';
  });

  // Use new HTML Audio Player hook
  const {
    audioRef,
    audioIsPlaying,
    audioVolume,
    audioIsMuted,
    audioCurrentTime,
    audioDuration,
    togglePlayPause: htmlAudioTogglePlayPause,
    setVolume: htmlAudioSetVolume,
    toggleMute: htmlAudioToggleMute,
    seekTo: htmlAudioSeekTo,
    skipForward: htmlAudioSkipForward,
    skipBackward: htmlAudioSkipBackward,
    onLoadedMetadata: htmlAudioOnLoadedMetadata,
    onTimeUpdate: htmlAudioOnTimeUpdate,
    onEnded: htmlAudioOnEnded,
  } = useHtmlAudioPlayer(playerType === 'audio' ? inputUrl : null);

  // Use YouTube Player hook
  const youtubeEmbedUrl = playerType === 'youtube' ? inputUrl : null; // Pass raw inputUrl to hook, it will derive embed URL
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
      setPlayerType(null);
      setCurrentTitle('No Media Loaded');
      setCurrentArtist('');
    }
  }, [inputUrl]);

  // Common functions for all players
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (playerType === 'audio') {
      htmlAudioTogglePlayPause();
    } else if (playerType === 'youtube') {
      youtubeTogglePlayPause();
    }
    // Spotify embed has its own controls, no programmatic toggle here
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (playerType === 'audio') {
      htmlAudioSetVolume(newVolume);
    } else if (playerType === 'youtube') {
      youtubeSetVolume(newVolume * 100); // YouTube API uses 0-100
    }
  };

  const toggleMute = () => {
    if (playerType === 'audio') {
      htmlAudioToggleMute();
    } else if (playerType === 'youtube') {
      // YouTube API doesn't have a direct toggleMute, so we simulate it
      if (youtubeVolume === 0) {
        youtubeSetVolume(50); // Unmute to a default volume
      } else {
        youtubeSetVolume(0); // Mute
      }
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (playerType === 'audio') {
      htmlAudioSeekTo(newTime);
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(newTime);
    }
  };

  const skipForward = () => {
    if (playerType === 'audio') {
      htmlAudioSkipForward();
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime + 10);
    }
  };

  const skipBackward = () => {
    if (playerType === 'audio') {
      htmlAudioSkipBackward();
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

  const PlayerIcon = playerType === 'youtube' ? Youtube : playerType === 'spotify' ? ListMusic : Music;

  const playerContainerClasses = cn(
    "fixed z-[1000] transition-all duration-300 ease-in-out",
    {
      'right-4 top-1/2 -translate-y-1/2 w-48 h-16': displayMode === 'minimized',
      'top-20 right-4 w-80 h-auto': displayMode === 'normal',
      'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-4xl w-full h-auto': displayMode === 'maximized',
    }
  );

  return (
    <>
      {/* Player Content (normal/maximized) */}
      {displayMode !== 'minimized' && (
        <div className={playerContainerClasses}>
          <div className="bg-card backdrop-blur-xl border-white/20 p-1 rounded-lg shadow-sm flex flex-col w-full h-full">
            <PlayerDisplay
              playerType={playerType}
              inputUrl={inputUrl}
              iframeId={iframeId}
              audioRef={audioRef}
            />

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
                <MediaInput
                  inputUrl={inputUrl}
                  setInputUrl={setInputUrl}
                  showUrlInput={showUrlInput}
                  setShowUrlInput={setShowUrlInput}
                  onLoadMedia={loadNewMedia}
                />
              </div>

              <PlayerControls
                playerType={playerType}
                playerIsReady={playerIsReady}
                currentIsPlaying={currentIsPlaying}
                togglePlayPause={togglePlayPause}
                skipBackward={skipBackward}
                skipForward={skipForward}
                currentVolume={currentVolume}
                currentIsMuted={currentIsMuted}
                toggleMute={toggleMute}
                handleVolumeChange={handleVolumeChange}
              />
            </div>

            <ProgressBar
              playerType={playerType}
              playerIsReady={playerIsReady}
              currentPlaybackTime={currentPlaybackTime}
              totalDuration={totalDuration}
              handleProgressBarChange={handleProgressBarChange}
              formatTime={formatTime}
            />

            <PlayerModeButtons displayMode={displayMode} setDisplayMode={setDisplayMode} />
          </div>
        </div>
      )}

      {/* Minimized Player Content (only visible when displayMode is 'minimized') */}
      {displayMode === 'minimized' && (
        <div
          className={cn(
            "fixed z-[1000] p-1 rounded-lg shadow-sm flex items-center justify-between",
            "bg-card backdrop-blur-xl border-white/20",
            "right-4 top-1/2 -translate-y-1/2 w-48 h-16"
          )}
          title="Expand Player"
        >
          <PlayerControls
            playerType={playerType}
            playerIsReady={playerIsReady}
            currentIsPlaying={currentIsPlaying}
            togglePlayPause={togglePlayPause}
            skipBackward={skipBackward}
            skipForward={skipForward}
            currentVolume={currentVolume}
            currentIsMuted={currentIsMuted}
            toggleMute={toggleMute}
            handleVolumeChange={handleVolumeChange}
          />

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