"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, ListMusic, Youtube, VolumeX, Volume2, ChevronLeft, ChevronUp, ChevronDown, Link } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player';
import { useSpotifyPlayer } from '@/hooks/use-spotify-player';
import { cn, getYouTubeEmbedUrl } from '@/lib/utils';
import { useSupabase } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Import Popover components
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer"; // Import Drawer components
import { MOBILE_HORIZONTAL_SIDEBAR_HEIGHT } from '@/lib/constants'; // Import new constant

// Import new modular components
import { PlayerDisplay } from './audio-player/player-display';
import { MediaInput } from './audio-player/media-input';
import { PlayerControls } from './audio-player/player-controls';
import { ProgressBar } from './audio-player/progress-bar';
import { MinimizedPlayerControls } from './audio-player/minimized-player-controls';

const LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY = 'simple_audio_player_display_mode';
const HEADER_HEIGHT = 64; // px
const EDGE_OFFSET = 4; // px, for padding from the edge

interface SimpleAudioPlayerProps {
  isMobile: boolean;
  displayMode?: 'normal' | 'maximized' | 'minimized'; // Optional prop for initial display mode
  className?: string; // Allow external classes for positioning
}

const SimpleAudioPlayer = ({ isMobile, displayMode: initialDisplayMode = 'normal', className }: SimpleAudioPlayerProps) => {
  const { session } = useSupabase();
  const [stagedInputUrl, setStagedInputUrl] = useState('');
  const [committedMediaUrl, setCommittedMediaUrl] = useState('');
  const [playerType, setPlayerType] = useState<'audio' | 'youtube' | 'spotify' | null>(null);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false); // State for popover/drawer
  const [displayMode, setDisplayMode] = useState<'normal' | 'maximized' | 'minimized'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY);
      if (isMobile) {
          // On mobile, allow normal, maximized, or minimized.
          return (savedMode === 'maximized' ? 'maximized' : (savedMode === 'minimized' ? 'minimized' : 'normal'));
      }
      return initialDisplayMode || (savedMode === 'minimized' ? 'minimized' : 'normal');
    }
    return initialDisplayMode;
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
    disconnectFromSpotify, // Added disconnect
    transferPlayback,
    playTrack: spotifyPlayTrack,
  } = useSpotifyPlayer(session?.access_token || null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY, displayMode);
    }
  }, [displayMode]);

  useEffect(() => {
    if (committedMediaUrl.includes('youtube.com') || committedMediaUrl.includes('youtu.be')) {
      setPlayerType('youtube');
    } else if (committedMediaUrl.includes('open.spotify.com')) {
      setPlayerType('spotify');
      // If Spotify URL is set and user is logged in, try to connect/play via SDK
      if (session?.access_token) {
        // connectToSpotify is called by the hook itself when accessToken is provided.
        // We only need to explicitly play the track if it's a new track and player is ready.
        if (spotifyPlayerReady && spotifyCurrentTrack?.uri !== committedMediaUrl) {
          spotifyPlayTrack(committedMediaUrl);
        }
      }
    } else if (committedMediaUrl.match(/\.(mp3|wav|ogg|aac|flac)$/i)) {
      setPlayerType('audio');
    } else {
      setPlayerType(null);
    }
  }, [committedMediaUrl, session?.access_token, spotifyPlayerReady, spotifyCurrentTrack, spotifyPlayTrack]);

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
    } else if (playerType === 'spotify') {
      spotifyTogglePlayPause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (playerType === 'audio') {
      htmlAudioToggleMute();
    } else if (playerType === 'youtube') {
      youtubeToggleMute();
    } else if (playerType === 'spotify') {
      spotifyToggleMute();
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (playerType === 'audio') {
      htmlAudioSkipForward();
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime + 10);
    } else if (playerType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(spotifyCurrentTime + 10);
    }
  };

  const skipBackward = () => {
    if (playerType === 'audio') {
      htmlAudioSkipBackward();
    } else if (playerType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime - 10);
    } else if (playerType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(spotifyCurrentTime - 10);
    }
  };

  const loadNewMedia = () => {
    setStagedInputUrl(stagedInputUrl.trim()); // Trim whitespace
    setCommittedMediaUrl(stagedInputUrl.trim());
    setIsUrlInputOpen(false); // Close popover/drawer after loading
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
      onClosePopover={() => setIsUrlInputOpen(false)}
    />
  );

  // Render the main player content (PlayerDisplay and controls)
  const mainPlayerContent = (
    <div className={cn(
      "bg-card/60 backdrop-blur-lg border-white/20 shadow-lg flex flex-col w-full h-full",
      displayMode === 'normal' && 'p-1 rounded-xl',
      displayMode === 'maximized' && 'p-4 rounded-none', // No rounded corners when maximized
    )}>
      <PlayerDisplay
        playerType={playerType}
        inputUrl={committedMediaUrl}
        audioRef={audioRef}
        youtubeIframeRef={youtubeIframeRef}
        spotifyCurrentTrack={spotifyCurrentTrack}
        onLoadedMetadata={htmlAudioOnLoadedMetadata}
        onTimeUpdate={htmlAudioOnTimeUpdate}
        onEnded={htmlAudioOnEnded}
        isMaximized={displayMode === 'maximized'}
        className={cn(
          'w-full',
          displayMode === 'maximized' ? 'flex-1' : '' // Take full height when maximized
        )}
      />

      {playerType === 'spotify' && spotifyCurrentTrack && (
        <div className="text-center p-0.5 flex-shrink-0">
          <p className="text-sm font-semibold truncate text-foreground">{spotifyCurrentTrack.name}</p>
          <p className="text-xs truncate text-muted-foreground">{spotifyCurrentTrack.artists.map((a: { name: string }) => a.name).join(', ')}</p>
        </div>
      )}

      <div className="flex items-center justify-between space-x-1 mb-0.5 flex-shrink-0 w-full">
        <div className="flex-grow min-w-0">
          <Drawer open={isUrlInputOpen} onOpenChange={setIsUrlInputOpen}>
            <DrawerTrigger asChild>
              <button
                className="text-xs font-bold text-primary hover:underline mt-0.5 flex items-center"
                title="Change Media URL"
              >
                <Link size={10} className="mr-0.5" />
                {isUrlInputOpen ? 'Hide URL' : 'Embed URL'}
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-auto max-h-[90vh] flex flex-col z-[1100]"> {/* Increased z-index */}
              <DrawerHeader>
                <DrawerTitle>Embed Media URL</DrawerTitle>
              </DrawerHeader>
              <div className="p-4">
                {renderMediaInput}
              </div>
            </DrawerContent>
          </Drawer>
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
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          isMobile={isMobile} // Pass isMobile prop
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

      {playerType === 'spotify' && session && !spotifyPlayerReady && (
        <div className="text-center text-xs text-muted-foreground mt-1">
          <p>Log in to Spotify for full playback control.</p>
          <Button onClick={connectToSpotify} className="text-primary hover:underline mt-0.5" size="sm">
            Connect to Spotify
          </Button>
        </div>
      )}
    </div>
  );

  // Render logic for mobile
  if (isMobile) {
    return (
      <div className={cn(
        "fixed z-[900] transition-all duration-300 ease-in-out",
        displayMode === 'normal' && `top-32 right-4 w-64 rounded-xl`, // Changed top from 24 to 32
        displayMode === 'minimized' && 'top-1/2 -translate-y-1/2 right-4 w-10 h-[120px] rounded-full', // Vertical minimized
        displayMode === 'maximized' && 'inset-0 w-full h-full flex flex-col items-center justify-center rounded-none',
        className // Apply external positioning classes
      )}>
        {/* Always render mainPlayerContent, but hide it with CSS if minimized */}
        <div className={cn(
          "w-full h-full",
          displayMode === 'minimized' && 'opacity-0 pointer-events-none absolute' // Keep it mounted but invisible and non-interactive
        )}>
          {mainPlayerContent}
        </div>

        {displayMode === 'minimized' && (
          <div
            className={cn(
              "bg-card/60 backdrop-blur-xl border-white/20 p-1 rounded-full flex items-center justify-between w-full h-full"
            )}
            title="Expand Player"
          >
            <MinimizedPlayerControls
              playerType={playerType}
              playerIsReady={playerIsReady}
              currentIsPlaying={currentIsPlaying}
              togglePlayPause={togglePlayPause}
              currentVolume={currentVolume}
              currentIsMuted={currentIsMuted}
              toggleMute={toggleMute}
              setDisplayMode={setDisplayMode}
              isMobile={isMobile} // Pass isMobile prop
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop rendering
  return (
    <div className={cn(
      "fixed z-[900] transition-all duration-300 ease-in-out",
      displayMode === 'normal' && `top-[72px] right-4 w-64 rounded-xl`, // Changed top from 120px to 72px
      displayMode === 'minimized' && 'right-4 top-1/2 -translate-y-1/2 w-10 h-[120px] rounded-full', // Adjusted height to h-[120px]
      displayMode === 'maximized' && 'right-4 top-1/2 -translate-y-1/2 w-96 flex flex-col items-center justify-center rounded-xl'
    )}>
      {/* Always render mainPlayerContent, but hide it with CSS if minimized */}
      <div className={cn(
        "w-full h-full",
        displayMode === 'minimized' && 'opacity-0 pointer-events-none absolute' // Keep it mounted but invisible and non-interactive
      )}>
        {mainPlayerContent}
      </div>

      {displayMode === 'minimized' && (
        <div
          className={cn(
            "bg-card/60 backdrop-blur-xl border-white/20 p-1 rounded-full flex items-center justify-between w-full h-full"
          )}
          title="Expand Player"
        >
          <MinimizedPlayerControls
            playerType={playerType}
            playerIsReady={playerIsReady}
            currentIsPlaying={currentIsPlaying}
            togglePlayPause={togglePlayPause}
            currentVolume={currentVolume}
            currentIsMuted={currentIsMuted}
            toggleMute={toggleMute}
            setDisplayMode={setDisplayMode}
            isMobile={isMobile} // Pass isMobile prop
          />
        </div>
      )}
    </div>
  );
};

export { SimpleAudioPlayer };