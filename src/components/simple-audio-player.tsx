"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Music, ListMusic, Youtube, VolumeX, Volume2, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react'; // Added ChevronDown
import { useYouTubePlayer } from '@/hooks/use-youtube-player';
import { useHtmlAudioPlayer } from '@/hooks/use-html-audio-player';
import { useSpotifyPlayer } from '@/hooks/use-spotify-player';
import { cn, getYouTubeEmbedUrl } from '@/lib/utils';
import { useSupabase } from '@/integrations/supabase/auth';
import { Button } from '@/components/ui/button'; // Added Button import

// Import new modular components
import { PlayerDisplay } from './audio-player/player-display';
import { MediaInput } from './audio-player/media-input';
import { PlayerControls } from './audio-player/player-controls';
import { ProgressBar } from './audio-player/progress-bar';
import { PlayerModeButtons } from './audio-player/player-mode-buttons';

const LOCAL_STORAGE_PLAYER_DISPLAY_MODE_KEY = 'simple_audio_player_display_mode';

interface SimpleAudioPlayerProps {
  isMobile: boolean; // New prop
}

const SimpleAudioPlayer = ({ isMobile }: SimpleAudioPlayerProps) => {
  const { session } = useSupabase();
  const [stagedInputUrl, setStagedInputUrl] = useState('');
  const [committedMediaUrl, setCommittedMediaUrl] = useState('');
  const [playerType, setPlayerType] = useState<'audio' | 'youtube' | 'spotify' | null>(null);
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
    setCommittedMediaUrl(stagedInputUrl);
    setShowUrlInput(false);
  };

  const currentPlaybackTime = playerType === 'youtube' ? youtubeCurrentTime : (playerType === 'spotify' ? spotifyCurrentTime : audioCurrentTime);
  const totalDuration = playerType === 'youtube' ? youtubeDuration : (playerType === 'spotify' ? spotifyDuration : audioDuration);
  const currentVolume = playerType === 'youtube' ? youtubeVolume / 100 : (playerType === 'spotify' ? spotifyVolume : audioVolume);
  const currentIsPlaying = playerType === 'youtube' ? youtubeIsPlaying : (playerType === 'spotify' ? spotifyIsPlaying : audioIsPlaying);
  const playerIsReady = playerType === 'youtube' ? youtubePlayerReady : (playerType === 'spotify' ? spotifyPlayerReady : true);
  const currentIsMuted = playerType === 'youtube' ? youtubeIsMuted : (playerType === 'spotify' ? spotifyIsMuted : audioIsMuted);

  const canPlayPause = playerIsReady;
  const canSeek = playerIsReady && totalDuration > 0;

  // Mobile specific state for expanded/collapsed
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const toggleMobileExpand = () => {
    setIsMobileExpanded(prev => !prev);
  };

  if (isMobile) {
    return (
      <div className={cn(
        "fixed bottom-4 left-4 right-4 z-[900] transition-all duration-300 ease-in-out",
        "bg-card/40 backdrop-blur-xl border-white/20 rounded-lg shadow-sm flex flex-col w-auto",
        isMobileExpanded ? "h-auto p-2" : "h-16 p-2 items-center justify-between flex-row"
      )}>
        {isMobileExpanded ? (
          <>
            {/* PlayerDisplay is now inside and will fill available space */}
            <PlayerDisplay
              playerType={playerType}
              inputUrl={committedMediaUrl}
              audioRef={audioRef}
              youtubeIframeRef={youtubeIframeRef}
              spotifyCurrentTrack={spotifyCurrentTrack}
              onLoadedMetadata={htmlAudioOnLoadedMetadata}
              onTimeUpdate={htmlAudioOnTimeUpdate}
              onEnded={htmlAudioOnEnded}
              isMaximized={false} // Not maximized in mobile expanded view
              className="w-full"
            />

            {/* Spotify Track Info */}
            {playerType === 'spotify' && spotifyCurrentTrack && (
              <div className="text-center p-1 flex-shrink-0">
                <p className="text-sm font-semibold truncate text-foreground">{spotifyCurrentTrack.name}</p>
                <p className="text-xs truncate text-muted-foreground">{spotifyCurrentTrack.artists.map(a => a.name).join(', ')}</p>
              </div>
            )}

            {/* Main Player Row: URL Input Toggle and Controls */}
            <div className="flex items-center justify-between space-x-1.5 mb-1 flex-shrink-0 w-full">
              {/* URL Input Toggle */}
              <div className="flex-grow min-w-0">
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

            {playerType === 'spotify' && !spotifyPlayerReady && (
              <div className="text-center text-sm text-muted-foreground mt-2">
                <p>Connect to Spotify to enable playback.</p>
                <Button onClick={connectToSpotify} className="text-primary hover:underline mt-1">
                  Connect to Spotify
                </Button>
              </div>
            )}
            <Button
              onClick={toggleMobileExpand}
              className="w-full mt-2"
              variant="secondary"
            >
              <ChevronDown className="mr-2 h-4 w-4" /> Collapse Player
            </Button>
          </>
        ) : (
          // Minimized mobile view
          <>
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
              onClick={toggleMobileExpand}
              className="p-1 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 ml-1 flex-shrink-0"
              title="Expand Player"
            >
              <ChevronUp size={16} />
            </button>
          </>
        )}
      </div>
    );
  }

  // Desktop rendering (original logic)
  return (
    <div className={cn(
      "fixed z-[900] transition-all duration-300 ease-in-out",
      displayMode === 'normal' && 'top-20 right-4 w-80',
      displayMode === 'minimized' && 'right-4 top-1/2 -translate-y-1/2 w-48 h-16',
      displayMode === 'maximized' && 'right-4 top-1/2 -translate-y-1/2 w-[500px] flex flex-col items-center justify-center'
    )}>
      <div className={cn(
        "bg-card/40 backdrop-blur-xl border-white/20 rounded-lg shadow-sm flex flex-col w-full",
        displayMode === 'normal' && 'p-1',
        displayMode === 'maximized' && 'p-4 items-center justify-center',
        displayMode === 'minimized' && 'hidden'
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
            displayMode === 'minimized' ? 'opacity-0 absolute pointer-events-none' : '',
            'w-full'
          )}
        />

        {playerType === 'spotify' && spotifyCurrentTrack && (
          <div className="text-center p-1 flex-shrink-0">
            <p className="text-sm font-semibold truncate text-foreground">{spotifyCurrentTrack.name}</p>
            <p className="text-xs truncate text-muted-foreground">{spotifyCurrentTrack.artists.map(a => a.name).join(', ')}</p>
          </div>
        )}

        <div className="flex items-center justify-between space-x-1.5 mb-1 flex-shrink-0 w-full">
          <div className="flex-grow min-w-0">
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

        {playerType === 'spotify' && !spotifyPlayerReady && (
          <div className="text-center text-sm text-muted-foreground mt-2">
            <p>Connect to Spotify to enable playback.</p>
            <Button onClick={connectToSpotify} className="text-primary hover:underline mt-1">
              Connect to Spotify
            </Button>
          </div>
        )}

        <PlayerModeButtons displayMode={displayMode} setDisplayMode={setDisplayMode} />
      </div>

      {displayMode === 'minimized' && (
        <div
          className={cn(
            "bg-card/40 backdrop-blur-xl border-white/20 p-1 rounded-lg shadow-sm flex items-center justify-between w-full h-full"
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