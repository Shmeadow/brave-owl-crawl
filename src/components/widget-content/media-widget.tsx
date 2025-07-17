"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Link } from "lucide-react";
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

// Import modular components
import { PlayerDisplay } from '@/components/audio-player/player-display';
import { MediaInput } from '@/components/audio-player/media-input';
import { PlayerControls } from '@/components/audio-player/player-controls';
import { ProgressBar } from '@/components/audio-player/progress-bar';

const LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY = 'simple_audio_player_display_mode';

interface MediaWidgetProps {
  isCurrentRoomWritable: boolean;
  isMobile: boolean;
}

export function MediaWidget({ isCurrentRoomWritable, isMobile }: MediaWidgetProps) {
  const { session } = useSupabase();
  const [stagedInputUrl, setStagedInputUrl] = useState('');
  const [committedMediaUrl, setCommittedMediaUrl] = useState('');
  const [playerType, setPlayerType] = useState<'audio' | 'youtube' | 'spotify' | null>(null);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<'normal' | 'maximized' | 'minimized'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY);
      return (savedMode === 'minimized' ? 'minimized' : 'normal');
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
    disconnectFromSpotify,
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
      if (session?.access_token) {
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
    setStagedInputUrl(stagedInputUrl.trim());
    setCommittedMediaUrl(stagedInputUrl.trim());
    setIsUrlInputOpen(false);
  };

  const currentPlaybackTime = playerType === 'youtube' ? youtubeCurrentTime : (playerType === 'spotify' ? spotifyCurrentTime : audioCurrentTime);
  const totalDuration = playerType === 'youtube' ? youtubeDuration : (playerType === 'spotify' ? spotifyDuration : audioDuration);
  const currentVolume = playerType === 'youtube' ? youtubeVolume / 100 : (playerType === 'spotify' ? spotifyVolume : audioVolume);
  const currentIsPlaying = playerType === 'youtube' ? youtubeIsPlaying : (playerType === 'spotify' ? spotifyIsPlaying : audioIsPlaying);
  const playerIsReady = playerType === 'youtube' ? youtubePlayerReady : (playerType === 'spotify' ? spotifyPlayerReady : true);
  const currentIsMuted = playerType === 'youtube' ? youtubeIsMuted : (playerType === 'spotify' ? spotifyIsMuted : audioIsMuted);

  const canPlayPause = playerIsReady && isCurrentRoomWritable;
  const canSeek = playerIsReady && totalDuration > 0 && isCurrentRoomWritable;

  const renderMediaInput = (
    <MediaInput
      inputUrl={stagedInputUrl}
      setInputUrl={setStagedInputUrl}
      onLoadMedia={loadNewMedia}
      onClosePopover={() => setIsUrlInputOpen(false)}
    />
  );

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <PlayerDisplay
            playerType={playerType}
            inputUrl={committedMediaUrl}
            audioRef={audioRef}
            youtubeIframeRef={youtubeIframeRef}
            spotifyCurrentTrack={spotifyCurrentTrack}
            onLoadedMetadata={htmlAudioOnLoadedMetadata}
            onTimeUpdate={htmlAudioOnTimeUpdate}
            onEnded={htmlAudioOnEnded}
            isMaximized={false}
            className="w-full h-full"
          />
        </div>

        {playerType === 'spotify' && spotifyCurrentTrack && (
          <div className="text-center">
            <p className="text-lg font-semibold truncate text-foreground">{spotifyCurrentTrack.name}</p>
            <p className="text-sm truncate text-muted-foreground">{spotifyCurrentTrack.artists.map((a: { name: string }) => a.name).join(', ')}</p>
          </div>
        )}

        <div className="flex items-center justify-between w-full">
          <div className="flex-grow min-w-0">
            {isMobile ? (
              <Drawer open={isUrlInputOpen} onOpenChange={setIsUrlInputOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:underline flex items-center"
                    title="Change Media URL"
                  >
                    <Link size={14} className="mr-1" />
                    {isUrlInputOpen ? 'Hide URL' : 'Embed URL'}
                  </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:underline flex items-center"
                    title="Change Media URL"
                  >
                    <Link size={14} className="mr-1" />
                    {isUrlInputOpen ? 'Hide URL' : 'Embed URL'}
                  </Button>
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
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
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
          <div className="text-center text-sm text-muted-foreground mt-2">
            <p>Log in to Spotify for full playback control.</p>
            <Button onClick={connectToSpotify} className="text-primary hover:underline mt-1" size="sm">
              Connect to Spotify
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}