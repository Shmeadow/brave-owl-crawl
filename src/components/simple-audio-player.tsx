"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, ListMusic, Youtube, VolumeX, Volume2, ChevronLeft, ChevronUp, ChevronDown, Link } from 'lucide-react';
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player';
import { useSpotifyPlayer } from '@/hooks/use-spotify-player';
import { cn, getYouTubeEmbedUrl } from '@/lib/utils';
import { useSupabase } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button';

// Import new modular components
import { PlayerDisplay } from './audio-player/player-display';
import { PlayerControls } from './audio-player/player-controls';
import { ProgressBar } from './audio-player/progress-bar';
import { MinimizedPlayerControls } from './audio-player/minimized-player-controls';

const LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY = 'simple_audio_player_display_mode';

interface SimpleAudioPlayerProps {
  mediaUrl: string | null;
  mediaType: 'audio' | 'youtube' | 'spotify' | null;
  isCurrentRoomWritable?: boolean; // Added for consistency, though player controls usually aren't room-writable
}

const SimpleAudioPlayer = ({ mediaUrl, mediaType, isCurrentRoomWritable = true }: SimpleAudioPlayerProps) => {
  const { session } = useSupabase();
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
  } = useHtmlAudioPlayer(mediaType === 'audio' ? mediaUrl : null);

  const youtubeEmbedUrl = mediaType === 'youtube' ? getYouTubeEmbedUrl(mediaUrl || '') : null;
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

  // Handle playing Spotify track when mediaUrl changes to a Spotify URI
  useEffect(() => {
    if (mediaType === 'spotify' && mediaUrl && spotifyPlayerReady && spotifyCurrentTrack?.uri !== mediaUrl) {
      spotifyPlayTrack(mediaUrl);
    }
  }, [mediaUrl, mediaType, spotifyPlayerReady, spotifyCurrentTrack, spotifyPlayTrack]);


  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (mediaType === 'audio') {
      htmlAudioTogglePlayPause();
    } else if (mediaType === 'youtube') {
      youtubeTogglePlayPause();
    } else if (mediaType === 'spotify') {
      spotifyTogglePlayPause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (mediaType === 'audio') {
      htmlAudioSetVolume(newVolume);
    } else if (mediaType === 'youtube') {
      youtubeSetVolume(newVolume * 100);
    } else if (mediaType === 'spotify') {
      spotifySetVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (mediaType === 'audio') {
      htmlAudioToggleMute();
    } else if (mediaType === 'youtube') {
      youtubeToggleMute();
    } else if (mediaType === 'spotify') {
      spotifyToggleMute();
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (mediaType === 'audio') {
      htmlAudioSeekTo(newTime);
    } else if (mediaType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(newTime);
    } else if (mediaType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(newTime);
    }
  };

  const skipForward = () => {
    if (mediaType === 'audio') {
      htmlAudioSkipForward();
    } else if (mediaType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime + 10);
    } else if (mediaType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(spotifyCurrentTime + 10);
    }
  };

  const skipBackward = () => {
    if (mediaType === 'audio') {
      htmlAudioSkipBackward();
    } else if (mediaType === 'youtube' && youtubePlayerReady) {
      youtubeSeekTo(youtubeCurrentTime - 10);
    } else if (mediaType === 'spotify' && spotifyPlayerReady) {
      spotifySeekTo(spotifyCurrentTime - 10);
    }
  };

  const currentPlaybackTime = mediaType === 'youtube' ? youtubeCurrentTime : (mediaType === 'spotify' ? spotifyCurrentTime : audioCurrentTime);
  const totalDuration = mediaType === 'youtube' ? youtubeDuration : (mediaType === 'spotify' ? spotifyDuration : audioDuration);
  const currentVolume = mediaType === 'youtube' ? youtubeVolume / 100 : (mediaType === 'spotify' ? spotifyVolume : audioVolume);
  const currentIsPlaying = mediaType === 'youtube' ? youtubeIsPlaying : (mediaType === 'spotify' ? spotifyIsPlaying : audioIsPlaying);
  const playerIsReady = mediaType === 'youtube' ? youtubePlayerReady : (mediaType === 'spotify' ? spotifyPlayerReady : true);
  const currentIsMuted = mediaType === 'youtube' ? youtubeIsMuted : (mediaType === 'spotify' ? spotifyIsMuted : audioIsMuted);

  const canPlayPause = playerIsReady;
  const canSeek = playerIsReady && totalDuration > 0;

  // This component is now designed to be embedded, so it doesn't handle its own fixed positioning or mobile/desktop differentiation.
  // It will render based on the `displayMode` prop, which can be controlled by its parent.
  return (
    <div className="w-full h-full flex flex-col">
      <PlayerDisplay
        playerType={mediaType}
        inputUrl={mediaUrl || ''}
        audioRef={audioRef}
        youtubeIframeRef={youtubeIframeRef}
        spotifyCurrentTrack={spotifyCurrentTrack}
        onLoadedMetadata={htmlAudioOnLoadedMetadata}
        onTimeUpdate={htmlAudioOnTimeUpdate}
        onEnded={htmlAudioOnEnded}
        isMaximized={displayMode === 'maximized'}
        className="w-full flex-grow"
      />

      {mediaType === 'spotify' && spotifyCurrentTrack && (
        <div className="text-center p-1 flex-shrink-0">
          <p className="text-sm font-semibold truncate text-foreground">{spotifyCurrentTrack.name}</p>
          <p className="text-xs truncate text-muted-foreground">{spotifyCurrentTrack.artists.map(a => a.name).join(', ')}</p>
        </div>
      )}

      <div className="flex items-center justify-between space-x-1.5 mb-1 flex-shrink-0 w-full">
        {/* Removed URL input popover as this component is now for predefined media or external control */}
        <PlayerControls
          playerType={mediaType}
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
        playerType={mediaType}
        playerIsReady={playerIsReady}
        currentPlaybackTime={currentPlaybackTime}
        totalDuration={totalDuration}
        handleProgressBarChange={handleProgressBarChange}
        formatTime={formatTime}
      />

      {mediaType === 'spotify' && !spotifyPlayerReady && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          <p>Connect to Spotify to enable playback.</p>
          <Button onClick={connectToSpotify} className="text-primary hover:underline mt-1">
            Connect to Spotify
          </Button>
        </div>
      )}
    </div>
  );
};

export { SimpleAudioPlayer };