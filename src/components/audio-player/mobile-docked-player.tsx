"use client";

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, Link } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

import { PlayerDisplay } from './player-display';
import { MediaInput } from './media-input';
import { ProgressBar } from './progress-bar';

interface MobileDockedPlayerProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  committedMediaUrl: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  youtubeIframeRef: React.RefObject<HTMLIFrameElement | null>;
  spotifyCurrentTrack: any; // Use specific SpotifyTrack type if available
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  playerIsReady: boolean;
  currentIsPlaying: boolean;
  togglePlayPause: () => void;
  currentVolume: number;
  currentIsMuted: boolean;
  toggleMute: () => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentPlaybackTime: number;
  totalDuration: number;
  handleProgressBarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (time: number) => string;
  stagedInputUrl: string;
  setStagedInputUrl: (url: string) => void;
  loadNewMedia: () => void;
  connectToSpotify: () => void;
  session: any; // Supabase session
  spotifyPlayerReady: boolean;
}

const HEADER_HEIGHT = 64; // px
const MOBILE_HORIZONTAL_SIDEBAR_HEIGHT = 48; // px
const EDGE_OFFSET = 4; // px

export function MobileDockedPlayer({
  playerType,
  committedMediaUrl,
  audioRef,
  youtubeIframeRef,
  spotifyCurrentTrack,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  playerIsReady,
  currentIsPlaying,
  togglePlayPause,
  currentVolume,
  currentIsMuted,
  toggleMute,
  handleVolumeChange,
  currentPlaybackTime,
  totalDuration,
  handleProgressBarChange,
  formatTime,
  stagedInputUrl,
  setStagedInputUrl,
  loadNewMedia,
  connectToSpotify,
  session,
  spotifyPlayerReady,
}: MobileDockedPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUrlInputOpen, setIsUrlInputOpen] = useState(false); // State for drawer

  const renderMediaInput = (
    <MediaInput
      inputUrl={stagedInputUrl}
      setInputUrl={setStagedInputUrl}
      onLoadMedia={loadNewMedia}
      onClosePopover={() => setIsUrlInputOpen(false)}
    />
  );

  const mobilePlayerTop = HEADER_HEIGHT + MOBILE_HORIZONTAL_SIDEBAR_HEIGHT + EDGE_OFFSET;

  return (
    <div
      className={cn(
        "fixed z-[900] transition-all duration-300 ease-in-out",
        `top-[${mobilePlayerTop}px] right-[${EDGE_OFFSET}px]`,
        "bg-card/60 backdrop-blur-lg border-white/20 shadow-lg rounded-full",
        "flex flex-col items-center justify-between p-1", // Reduced padding
        "w-12", // Slim width
        isExpanded ? "h-[200px]" : "h-[105px]" // Expanded height vs minimized height
      )}
    >
      {/* Player Display (hidden or very small) */}
      <div className={cn(
        "w-full h-0 overflow-hidden", // Hide player display
        isExpanded && "h-16" // Optionally show a small player display when expanded
      )}>
        <PlayerDisplay
          playerType={playerType}
          inputUrl={committedMediaUrl}
          audioRef={audioRef}
          youtubeIframeRef={youtubeIframeRef}
          spotifyCurrentTrack={spotifyCurrentTrack}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          isMaximized={false}
          className="w-full h-full"
        />
      </div>

      {/* Spotify Track Info (only visible when expanded) */}
      {isExpanded && playerType === 'spotify' && spotifyCurrentTrack && (
        <div className="text-center p-0.5 flex-shrink-0">
          <p className="text-xs font-semibold truncate text-foreground">{spotifyCurrentTrack.name}</p>
          <p className="text-xs truncate text-muted-foreground">{spotifyCurrentTrack.artists.map((a: { name: string }) => a.name).join(', ')}</p>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex flex-col items-center gap-1 w-full"> {/* Vertical stack for controls */}
        {/* Play/Pause Button */}
        <Button
          onClick={togglePlayPause}
          className="p-0.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition duration-300 shadow-xs transform hover:scale-105 h-7 w-7 flex items-center justify-center"
          aria-label={currentIsPlaying ? "Pause" : "Play"}
          title={currentIsPlaying ? "Pause" : "Play"}
          disabled={!playerIsReady}
        >
          {currentIsPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>

        {/* Mute/Unmute Button */}
        <Button
          onClick={toggleMute}
          className="p-0 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition duration-300 h-7 w-7 flex items-center justify-center"
          aria-label={currentIsMuted ? "Unmute" : "Mute"}
          title={currentIsMuted ? "Unmute" : "Mute"}
          disabled={!playerIsReady || playerType === 'spotify'}
        >
          {currentIsMuted || currentVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </Button>

        {/* Progress Bar (only visible when expanded) */}
        {isExpanded && (
          <ProgressBar
            playerType={playerType}
            playerIsReady={playerIsReady}
            currentPlaybackTime={currentPlaybackTime}
            totalDuration={totalDuration}
            handleProgressBarChange={handleProgressBarChange}
            formatTime={formatTime}
          />
        )}

        {/* URL Input Toggle (Drawer for mobile, only visible when expanded) */}
        {isExpanded && (
          <Drawer open={isUrlInputOpen} onOpenChange={setIsUrlInputOpen}>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary hover:bg-primary/10"
                title="Change Media URL"
              >
                <Link size={16} />
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
        )}

        {/* Expand/Collapse Button */}
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-0.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition duration-300 h-7 w-7 flex items-center justify-center"
          title={isExpanded ? "Collapse Player" : "Expand Player"}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </Button>
      </div>

      {playerType === 'spotify' && session && !spotifyPlayerReady && isExpanded && (
        <div className="text-center text-xs text-muted-foreground mt-1">
          <p>Log in to Spotify for full playback control.</p>
          <Button onClick={connectToSpotify} className="text-primary hover:underline mt-0.5" size="sm">
            Connect to Spotify
          </Button>
        </div>
      )}
    </div>
  );
}