"use client";

import React, { useState, useEffect } from 'react';
import { Music, ListMusic, Youtube, VolumeX, Volume2, ChevronLeft } from 'lucide-react'; // Keep only the icons used directly here
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player';
import { cn, getYouTubeEmbedUrl } from '@/lib/utils'; // Import getYouTubeEmbedUrl

// Import new modular components
import { PlayerDisplay } from './audio-player/player-display';
import { MediaInput } from './audio-player/media-input';
import { PlayerControls } from './audio-player/player-controls';
import { ProgressBar } from './audio-player/progress-bar';
import { PlayerModeButtons } from './audio-player/player-mode-buttons';

const LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY = 'simple_audio_player_display_mode';

const SimpleAudioPlayer = () => {
  const [stagedInputUrl, setStagedInputUrl] = useState(''); // New: URL as typed by user
  const [committedMediaUrl, setCommittedMediaUrl] = useState(''); // New: URL actually used by player
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
  } = useHtmlAudioPlayer(playerType === 'audio' ? committedMediaUrl : null); // Use committedMediaUrl

  // Use YouTube Player hook - pass the converted embed URL
  const youtubeEmbedUrl = playerType === 'youtube' ? getYouTubeEmbedUrl(committedMediaUrl) : null; // Use committedMediaUrl
  const {
    isPlaying: youtubeIsPlaying,
    volume: youtubeVolume,
    isMuted: youtubeIsMuted,
    togglePlayPause: youtubeTogglePlayPause,
    setVolume: youtubeSetVolume,
    toggleMute: youtubeToggleMute,
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

  // Determine player type and set initial title/artist when committedMediaUrl changes
  useEffect(() => {
    if (committedMediaUrl.includes('youtube.com') || committedMediaUrl.includes('youtu.be')) {
      setPlayerType('youtube');
      setCurrentTitle('YouTube Video');
      setCurrentArtist('Unknown Artist');
    } else if (committedMediaUrl.includes('open.spotify.com')) {
      setPlayerType('spotify');
      setCurrentTitle('Spotify Media');
      setCurrentArtist('Unknown Artist');
    } else if (committedMediaUrl.match(/\.(mp3|wav|ogg|aac|flac)$/i)) {
      setPlayerType('audio');
      setCurrentTitle('Direct Audio');
      setCurrentArtist('Unknown Artist');
    } else {
      setPlayerType(null);
      setCurrentTitle('No Media Loaded');
      setCurrentArtist('');
    }
  }, [committedMediaUrl]); // Depend on committedMediaUrl

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
      youtubeToggleMute();
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
    setCommittedMediaUrl(stagedInputUrl); // Commit the staged URL
    setShowUrlInput(false);
  };

  const currentPlaybackTime = playerType === 'youtube' ? youtubeCurrentTime : audioCurrentTime;
  const totalDuration = playerType === 'youtube' ? youtubeDuration : audioDuration;
  const currentVolume = playerType === 'youtube' ? youtubeVolume / 100 : audioVolume;
  const currentIsPlaying = playerType === 'youtube' ? youtubeIsPlaying : audioIsPlaying;
  const currentIsMuted = playerType === 'youtube' ? youtubeIsMuted : audioIsMuted;
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
              inputUrl={committedMediaUrl} // Pass committedMediaUrl
              iframeId={iframeId}
              audioRef={audioRef}
              onLoadedMetadata={htmlAudioOnLoadedMetadata}
              onTimeUpdate={htmlAudioOnTimeUpdate}
              onEnded={htmlAudioOnEnded}
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
                  inputUrl={stagedInputUrl} // Use stagedInputUrl for the input field
                  setInputUrl={setStagedInputUrl} // Update stagedInputUrl
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
                totalDuration={totalDuration}
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
            totalDuration={totalDuration}
          />

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