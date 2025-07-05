"use client";

import React from 'react';
import Image from 'next/image';
import { getYouTubeEmbedUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { SpotifyTrack } from '@/hooks/use-spotify-player';

interface PlayerDisplayProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  inputUrl: string;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  youtubeIframeRef: React.RefObject<HTMLIFrameElement | null>;
  spotifyCurrentTrack: SpotifyTrack | null;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  className?: string;
  isMaximized: boolean; // New prop
}

export function PlayerDisplay({
  playerType,
  inputUrl,
  audioRef,
  youtubeIframeRef,
  spotifyCurrentTrack,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  className,
  isMaximized,
}: PlayerDisplayProps) {
  const youtubeEmbedUrl = playerType === 'youtube' ? getYouTubeEmbedUrl(inputUrl) : null;
  const albumArtUrl = spotifyCurrentTrack?.album?.images?.[0]?.url;

  // Determine the aspect ratio class based on playerType
  const aspectRatioClass = playerType === 'youtube' ? 'aspect-video' : (playerType === 'spotify' ? 'aspect-square' : '');

  return (
    <>
      {playerType === 'audio' && (
        <audio
          ref={audioRef}
          src={inputUrl}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onEnded}
          preload="metadata"
          className={cn(className, 'w-full h-full', isMaximized ? 'object-contain' : 'object-cover')}
        >
          Your browser does not support the audio element.
        </audio>
      )}
      {(playerType === 'youtube' && youtubeEmbedUrl) && (
        <div className={cn(
          "relative w-full overflow-hidden",
          className,
          aspectRatioClass,
          isMaximized ? 'flex-grow' : '' // Allow YouTube iframe to grow in maximized mode
        )}>
          <iframe
            ref={youtubeIframeRef}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={youtubeEmbedUrl}
            frameBorder="0"
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube video player"
          ></iframe>
        </div>
      )}
      {playerType === 'spotify' && (
        <div className={cn(
          "relative w-full overflow-hidden bg-black rounded-lg",
          className,
          aspectRatioClass,
          isMaximized ? 'flex-grow' : '' // Allow Spotify display to grow in maximized mode
        )}>
          {albumArtUrl ? (
            <Image
              src={albumArtUrl}
              alt={spotifyCurrentTrack?.album?.name || 'Album Art'}
              fill
              className={cn("object-contain", isMaximized ? 'object-contain' : 'object-cover')} // Ensure object-contain for maximized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
              <span>Spotify Player</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}