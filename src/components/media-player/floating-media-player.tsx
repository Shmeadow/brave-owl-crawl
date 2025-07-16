"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Link, Maximize, Minimize } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player';
import { useSpotifyPlayer } from '@/hooks/use-spotify-player';
import { cn, getYouTubeEmbedUrl } from '@/lib/utils';
import { useSupabase } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useDraggable } from "@dnd-kit/core";
import { PlayerDisplay } from '../audio-player/player-display';
import { MediaInput } from '../audio-player/media-input';
import { PlayerControls } from '../audio-player/player-controls';
import { ProgressBar } from '../audio-player/progress-bar';

export interface FloatingMediaPlayerProps {
  isCurrentRoomWritable: boolean;
  isMobile: boolean;
  chatPanelWidth: number; // New prop
}

const LOCAL_STORAGE_MAXIMIZED_KEY = 'floating_media_player_maximized';
const LOCAL_STORAGE_MINIMIZED_KEY = 'floating_media_player_minimized';
const LOCAL_STORAGE_NORMAL_POS_KEY = 'floating_media_player_normal_position';
const LOCAL_STORAGE_NORMAL_SIZE_KEY = 'floating_media_player_normal_size';
const LOCAL_STORAGE_URL_KEY = 'floating_media_player_url';

const DEFAULT_NORMAL_WIDTH = 300;
const DEFAULT_NORMAL_HEIGHT = 400;
const MINIMIZED_WIDTH = 150;
const MINIMIZED_HEIGHT = 100;
const BOTTOM_RIGHT_OFFSET = 16; // Padding from screen edge

export function FloatingMediaPlayer({ isCurrentRoomWritable, isMobile, chatPanelWidth }: FloatingMediaPlayerProps) {
  const { session } = useSupabase();
  const [stagedInputUrl, setStagedInputUrl] = useState('');
  const [committedMediaUrl, setCommittedMediaUrl] = useState('');
  const [playerType, setPlayerType] = useState<'audio' | 'youtube' | 'spotify' | null>(null);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);

  // States for player display mode
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Default to minimized for "small" mode

  // States to store normal (non-maximized, non-minimized) position and size
  const [normalPosition, setNormalPosition] = useState({ x: 0, y: 0 });
  const [normalSize, setNormalSize] = useState({ width: DEFAULT_NORMAL_WIDTH, height: DEFAULT_NORMAL_HEIGHT });

  const youtubeIframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<HTMLDivElement>(null); // Ref for the draggable player container

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

  const {
    playerReady: spotifyPlayerReady,
    isPlaying: spotifyIsPlaying,
    volume: spotifyVolume,
    isMuted: spotifyIsMuted,
    currentTrack: spotifyCurrentTrack,
    spotifyCurrentTime,
    spotifyDuration,
    togglePlayPause: spotifyTogglePlayPause,
    setVolume: spotifySetVolume,
    toggleMute: spotifyToggleMute,
    seekTo: spotifySeekTo,
    connectToSpotify,
    playTrack: spotifyPlayTrack,
  } = useSpotifyPlayer(session?.access_token || null);

  // Load saved states from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMaximized = localStorage.getItem(LOCAL_STORAGE_MAXIMIZED_KEY);
      const savedMinimized = localStorage.getItem(LOCAL_STORAGE_MINIMIZED_KEY);
      const savedNormalPos = localStorage.getItem(LOCAL_STORAGE_NORMAL_POS_KEY);
      const savedNormalSize = localStorage.getItem(LOCAL_STORAGE_NORMAL_SIZE_KEY);
      const savedUrl = localStorage.getItem(LOCAL_STORAGE_URL_KEY);

      if (savedMaximized === 'true') {
        setIsMaximized(true);
        setIsMinimized(false);
      } else if (savedMinimized === 'true') {
        setIsMinimized(true);
        setIsMaximized(false);
      } else {
        // Default to minimized if no explicit state saved
        setIsMinimized(true);
        setIsMaximized(false);
      }

      if (savedNormalPos) {
        setNormalPosition(JSON.parse(savedNormalPos));
      } else {
        // Default normal position if not saved (e.g., top right)
        setNormalPosition({ x: window.innerWidth - DEFAULT_NORMAL_WIDTH - BOTTOM_RIGHT_OFFSET, y: 100 });
      }
      if (savedNormalSize) {
        setNormalSize(JSON.parse(savedNormalSize));
      }

      if (savedUrl) {
        setCommittedMediaUrl(savedUrl);
        setStagedInputUrl(savedUrl);
      }
    }
  }, []);

  // Save states to local storage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_MAXIMIZED_KEY, String(isMaximized));
      localStorage.setItem(LOCAL_STORAGE_MINIMIZED_KEY, String(isMinimized));
      localStorage.setItem(LOCAL_STORAGE_NORMAL_POS_KEY, JSON.stringify(normalPosition));
      localStorage.setItem(LOCAL_STORAGE_NORMAL_SIZE_KEY, JSON.stringify(normalSize));
      localStorage.setItem(LOCAL_STORAGE_URL_KEY, committedMediaUrl);
    }
  }, [isMaximized, isMinimized, normalPosition, normalSize, committedMediaUrl]);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'floating-media-player',
    data: { initialPosition: normalPosition }, // Dragging updates normalPosition
    disabled: isMobile || isMaximized || isMinimized, // Disable dragging when maximized or minimized
  });

  const currentTransformStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {};

  // Update normalPosition state when drag ends
  useEffect(() => {
    if (transform && !isMaximized && !isMinimized) {
      setNormalPosition(prev => ({
        x: prev.x + transform.x,
        y: prev.y + transform.y,
      }));
    }
  }, [transform, isMaximized, isMinimized]);

  useEffect(() => {
    if (committedMediaUrl.includes('youtube.com') || committedMediaUrl.includes('youtu.be')) {
      setPlayerType('youtube');
    } else if (committedMediaUrl.includes('open.spotify.com')) {
      setPlayerType('spotify');
      if (spotifyPlayerReady && spotifyCurrentTrack?.uri !== committedMediaUrl) {
        spotifyPlayTrack(committedMediaUrl);
      }
    } else if (committedMediaUrl.match(/\.(mp3|wav|ogg|aac|flac)$/i)) {
      setPlayerType('audio');
    } else {
      setPlayerType(null);
    }
  }, [committedMediaUrl, spotifyCurrentTrack, spotifyPlayerReady, spotifyPlayTrack]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (!isCurrentRoomWritable) return;
    if (playerType === 'audio') {
      htmlAudioTogglePlayPause();
    } else if (playerType === 'youtube') {
      youtubeTogglePlayPause();
    } else if (playerType === 'spotify') {
      spotifyTogglePlayPause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrentRoomWritable) return;
    const newVolume = parseFloat(e.target.value);
    if (playerType === 'audio') {
      htmlAudioSetVolume(newVolume);
    } else if (playerType === 'youtube') {
      youtubeSetVolume(newVolume * 100);
    } else if (playerType === 'spotify') {
      spotifySetVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (!isCurrentRoomWritable) return;
    if (playerType === 'audio') {
      htmlAudioToggleMute();
    } else if (playerType === 'youtube') {
      youtubeToggleMute();
    } else if (playerType === 'spotify') {
      spotifyToggleMute();
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCurrentRoomWritable) return;
    const newTime = parseFloat(e.target.value);
    if (playerType === 'audio') {
      htmlAudioSeekTo(newTime);
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(newTime);
    } else if (playerType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(newTime);
    }
  };

  const skipForward = () => {
    if (!isCurrentRoomWritable) return;
    if (playerType === 'audio') {
      htmlAudioSkipForward();
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime + 10);
    } else if (playerType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(spotifyCurrentTime + 10);
    }
  };

  const skipBackward = () => {
    if (!isCurrentRoomWritable) return;
    if (playerType === 'audio') {
      htmlAudioSkipBackward();
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime - 10);
    } else if (playerType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(spotifyCurrentTime - 10);
    }
  };

  const loadNewMedia = () => {
    setCommittedMediaUrl(stagedInputUrl);
    setIsUrlInputOpen(false);
  };

  const currentPlaybackTime = playerType === 'youtube' ? youtubeCurrentTime : (playerType === 'spotify' ? spotifyCurrentTime : audioCurrentTime);
  const totalDuration = playerType === 'youtube' ? youtubeDuration : (playerType === 'spotify' ? spotifyDuration : audioDuration);
  const currentVolume = playerType === 'youtube' ? youtubeVolume / 100 : (playerType === 'spotify' ? spotifyVolume : audioVolume);
  const currentIsPlaying = playerType === 'youtube' ? youtubeIsPlaying : (playerType === 'spotify' ? spotifyIsPlaying : audioIsPlaying);
  const playerIsReady = playerType === 'youtube' ? youtubePlayerReady : (playerType === 'spotify' ? spotifyPlayerReady : true);
  const currentIsMuted = playerType === 'youtube' ? youtubeIsMuted : (playerType === 'spotify' ? spotifyIsMuted : audioIsMuted);

  const canPlayPause = playerIsReady;
  const canSeek = playerIsReady && totalDuration > 0;

  const renderMediaInput = (
    <MediaInput
      inputUrl={stagedInputUrl}
      setInputUrl={setStagedInputUrl}
      onLoadMedia={loadNewMedia}
    />
  );

  const toggleMaximize = () => {
    if (isMaximized) {
      // Restore from maximized
      setIsMaximized(false);
      setIsMinimized(false); // Ensure not minimized
    } else {
      // Maximize
      setIsMaximized(true);
      setIsMinimized(false); // Ensure not minimized
    }
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      // Restore from minimized
      setIsMinimized(false);
      setIsMaximized(false); // Ensure not maximized
    } else {
      // Minimize
      setIsMinimized(true);
      setIsMaximized(false); // Ensure not maximized
    }
  };

  // Calculate dynamic style based on states
  const playerStyle: React.CSSProperties = isMobile
    ? { width: '100%', height: 'auto', position: 'relative' } // Mobile always takes full width, auto height
    : isMaximized
      ? {
          position: 'fixed',
          top: '64px', // Below header
          left: '60px', // Right of sidebar
          width: `calc(100vw - 60px)`,
          height: `calc(100vh - 64px)`,
          zIndex: 999, // High z-index for maximized
        }
      : isMinimized
        ? {
            position: 'fixed',
            right: `${BOTTOM_RIGHT_OFFSET + chatPanelWidth + BOTTOM_RIGHT_OFFSET}px`, // Right of chat panel
            bottom: `${BOTTOM_RIGHT_OFFSET}px`,
            width: MINIMIZED_WIDTH,
            height: MINIMIZED_HEIGHT,
            zIndex: 901, // Below widgets, above chat
          }
        : { // Normal mode (draggable, resizable)
            position: 'fixed',
            left: normalPosition.x,
            top: normalPosition.y,
            width: normalSize.width,
            height: normalSize.height,
            zIndex: 901, // Below widgets, above chat
            ...currentTransformStyle,
          };

  const isDraggable = !isMobile && !isMaximized && !isMinimized;
  const isResizable = !isMobile && !isMaximized && !isMinimized;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
        "transition-all duration-300 ease-in-out",
        isMobile ? "p-4" : "p-4", // Adjust padding for mobile
        isMaximized ? "rounded-none" : "", // No rounded corners when maximized
        !isCurrentRoomWritable && "opacity-70 cursor-not-allowed"
      )}
      style={playerStyle}
    >
      <div
        className={cn(
          "flex items-center justify-between p-2 border-b border-border/50 bg-background/80 backdrop-blur-md",
          isDraggable ? "cursor-grab" : "cursor-default"
        )}
        {...listeners}
        onDoubleClick={toggleMaximize} // Double click to maximize/restore
      >
        <div className="flex items-center flex-grow min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary mr-2">
            <Music className="h-5 w-5" />
          </div>
          <h4 className="text-sm font-semibold truncate">Media Player</h4>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMinimize}
            className="h-7 w-7"
            title={isMinimized ? "Restore Player" : "Minimize Player"}
          >
            {isMinimized ? <Maximize size={16} /> : <Minimize size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMaximize}
            className="h-7 w-7"
            title={isMaximized ? "Restore Player" : "Maximize Player"}
          >
            {isMaximized ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
        </div>
      </div>

      {/* Player content area, hidden when minimized */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
          <div className="flex-1 relative w-full flex items-center justify-center mb-2">
            <PlayerDisplay
              playerType={playerType}
              inputUrl={committedMediaUrl}
              audioRef={audioRef}
              youtubeIframeRef={youtubeIframeRef}
              spotifyCurrentTrack={spotifyCurrentTrack}
              onLoadedMetadata={htmlAudioOnLoadedMetadata}
              onTimeUpdate={htmlAudioOnTimeUpdate}
              onEnded={htmlAudioOnEnded}
              className="w-full h-full"
            />
          </div>

          {playerType === 'spotify' && spotifyCurrentTrack && (
            <div className="text-center p-1 flex-shrink-0">
              <p className="text-sm font-semibold truncate text-foreground">{spotifyCurrentTrack.name}</p>
              <p className="text-xs truncate text-muted-foreground">{spotifyCurrentTrack.artists.map(a => a.name).join(', ')}</p>
            </div>
          )}

          <div className="flex items-center justify-between space-x-1.5 mb-1 flex-shrink-0 w-full">
            <div className="flex-grow min-w-0">
              {isMobile ? (
                <Drawer open={isUrlInputOpen} onOpenChange={setIsUrlInputOpen}>
                  <DrawerTrigger asChild>
                    <button
                      className="text-xs font-bold text-primary hover:underline mt-0.5 flex items-center"
                      title="Change Media URL"
                    >
                      <Link size={12} className="mr-0.5" />
                      {isUrlInputOpen ? 'Hide URL' : 'Embed URL'}
                    </button>
                  </DrawerTrigger>
                  <DrawerContent className="h-auto max-h-[90vh] flex flex-col">
                    <DrawerHeader>
                      <DrawerTitle>Embed Media URL</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4">
                      {renderMediaInput}
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Popover open={isUrlInputOpen} onOpenChange={setIsUrlInputOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="text-xs font-bold text-primary hover:underline mt-0.5 flex items-center"
                      title="Change Media URL"
                    >
                      <Link size={12} className="mr-0.5" />
                      {isUrlInputOpen ? 'Hide URL' : 'Embed URL'}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 z-[901] bg-popover/80 backdrop-blur-lg border-white/20">
                    {renderMediaInput}
                  </PopoverContent>
                </Popover>
              )}
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

          {playerType === 'spotify' && !spotifyPlayerReady && (
            <div className="text-center text-sm text-muted-foreground mt-2">
              <p>Connect to Spotify to enable playback.</p>
              <Button onClick={connectToSpotify} className="text-primary hover:underline mt-1">
                Connect to Spotify
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}