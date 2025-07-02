"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Music, ListMusic, Youtube, VolumeX, Volume2, ChevronLeft } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player';
import { cn, getYouTubeEmbedUrl } from '@/lib/utils';

// Import new modular components
import { PlayerDisplay } from './audio-player/player-display';
import { MediaInput } from './audio-player/media-input';
import { PlayerControls } from './audio-player/player-controls';
import { ProgressBar } from './audio-player/progress-bar';
import { PlayerModeButtons } from './audio-player/player-mode-buttons';

const LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY = 'simple_audio_player_display_mode';

// Constants for layout dimensions (should match AppWrapper and PomodoroWidget)
const HEADER_HEIGHT = 64; // px
const POMODORO_WIDGET_HEIGHT_EST = 200; // px, estimated height when expanded
const POMODORO_WIDGET_BOTTOM_OFFSET = 20; // px, from PomodoroWidget's fixed bottom-20
const PLAYER_POMODORO_BUFFER = 20; // px

// Calculate the exact bottom position for the player
const MAXIMIZED_PLAYER_BOTTOM_POSITION = POMODORO_WIDGET_BOTTOM_OFFSET + POMODORO_WIDGET_HEIGHT_EST + PLAYER_POMODORO_BUFFER + 20; // Added 20px buffer
const MAXIMIZED_PLAYER_TOP_POSITION = HEADER_HEIGHT + 40; // Moved down by 40px


const SimpleAudioPlayer = () => {
  const [stagedInputUrl, setStagedInputUrl] = useState('');
  const [committedMediaUrl, setCommittedMediaUrl] = useState('');
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

  const youtubeIframeRef = useRef<HTMLIFrameElement>(null);

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
  } = useHtmlAudioPlayer(playerType === 'audio' ? committedMediaUrl : null);

  const youtubeEmbedUrl = playerType === 'youtube' ? getYouTubeEmbedUrl(committedMediaUrl) : null;
  const {
    isPlaying: youtubeIsPlaying,
    volume: youtubeVolume,
    isMuted: youtubeIsMuted,
    togglePlayPause: youtubeTogglePlayPause,
    setVolume: youtubeSetVolume,
    toggleMute: youtubeToggleMute,
    seekTo: youtubeSeekTo,
    playerReady: youtubePlayerReady,
    youtubeCurrentTime,
    youtubeDuration,
  } = useYouTubePlayer(youtubeEmbedUrl, youtubeIframeRef);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY, displayMode);
    }
  }, [displayMode]);

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
  }, [committedMediaUrl]);

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
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (playerType === 'audio') {
      htmlAudioSetVolume(newVolume);
    } else if (playerType === 'youtube') {
      youtubeSetVolume(newVolume * 100);
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
    setCommittedMediaUrl(stagedInputUrl);
    setShowUrlInput(false);
  };

  const currentPlaybackTime = playerType === 'youtube' ? youtubeCurrentTime : audioCurrentTime;
  const totalDuration = playerType === 'youtube' ? youtubeDuration : audioDuration;
  const currentVolume = playerType === 'youtube' ? youtubeVolume / 100 : audioVolume;
  const currentIsPlaying = playerType === 'youtube' ? youtubeIsPlaying : audioIsPlaying;
  const playerIsReady = playerType === 'youtube' ? youtubePlayerReady : true;
  const currentIsMuted = playerType === 'youtube' ? youtubeIsMuted : audioIsMuted;

  // New logic for canPlayPause and canSeek
  const canPlayPause = playerType !== 'spotify' && playerIsReady;
  const canSeek = playerType !== 'spotify' && playerIsReady && totalDuration > 0;

  const PlayerIcon = playerType === 'youtube' ? Youtube : playerType === 'spotify' ? ListMusic : Music;

  return (
    <div className={cn(
      "fixed z-[1000] transition-all duration-300 ease-in-out",
      displayMode === 'normal' && 'top-20 right-4 w-80',
      displayMode === 'minimized' && 'right-4 top-1/2 -translate-y-1/2 w-48 h-16',
      displayMode === 'maximized' && 'left-1/2 -translate-x-1/2 w-full max-w-3xl flex flex-col items-center justify-center' // Added items-center justify-center
    )}
    style={displayMode === 'maximized' ? { top: `${MAXIMIZED_PLAYER_TOP_POSITION}px`, bottom: `${MAXIMIZED_PLAYER_BOTTOM_POSITION}px` } : {}}
    >
      {/* Normal/Maximized Player UI */}
      <div className={cn(
        "bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-sm flex flex-col w-full h-full",
        displayMode === 'normal' && 'p-1',
        displayMode === 'maximized' && 'p-4 items-center justify-center', // Added items-center justify-center here too
        displayMode === 'minimized' && 'hidden'
      )}>
        {/* PlayerDisplay is now inside and will fill available space */}
        <PlayerDisplay
          playerType={playerType}
          inputUrl={committedMediaUrl}
          audioRef={audioRef}
          youtubeIframeRef={youtubeIframeRef}
          onLoadedMetadata={htmlAudioOnLoadedMetadata}
          onTimeUpdate={htmlAudioOnTimeUpdate}
          onEnded={htmlAudioOnEnded}
          isMaximized={displayMode === 'maximized'}
          className={cn(
            displayMode === 'minimized' ? 'opacity-0 absolute pointer-events-none' : '',
            displayMode === 'maximized' ? 'w-full' : '' // Ensure it takes full width of its container when maximized
          )}
        />

        {/* Main Player Row: Album Art, Track Info, Controls */}
        <div className="flex items-center justify-between space-x-1.5 mb-1 flex-shrink-0 w-full"> {/* Added w-full */}
          {/* Album Art Placeholder */}
          <div className="flex-shrink-0 bg-muted rounded-lg flex items-center justify-center text-muted-foreground shadow-xs w-12 h-12">
            <PlayerIcon size={24} />
          </div>

          {/* Track Info and URL Input Toggle */}
          <div className="flex-grow min-w-0">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{currentTitle}</p>
            <p className="text-xs text-muted-foreground truncate">{currentArtist}</p>
            <MediaInput
              inputUrl={stagedInputUrl}
              setInputUrl={setStagedInputUrl}
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
            canPlayPause={canPlayPause}
            canSeek={canSeek}
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

      {/* Minimized Player Content (only visible when displayMode is 'minimized') */}
      {displayMode === 'minimized' && (
        <div
          className={cn(
            "bg-card backdrop-blur-xl border-white/20 p-1 rounded-lg shadow-sm flex items-center justify-between w-full h-full"
          )}
          title="Expand Player"
          onClick={(e) => { e.stopPropagation(); setDisplayMode('normal'); }}
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
            canPlayPause={canPlayPause}
            canSeek={canSeek}
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
    </div>
  );
};

export { SimpleAudioPlayer };