"use client";

import React from 'react';
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl } from '@/lib/utils';
import { cn } from '@/lib/utils'; // Import cn for conditional classNames

interface PlayerDisplayProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  inputUrl: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  youtubeIframeRef: React.RefObject<HTMLIFrameElement>;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  className?: string; // New prop for conditional styling
  isMaximized: boolean; // New prop
}

export function PlayerDisplay({
  playerType,
  inputUrl,
  audioRef,
  youtubeIframeRef,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  className, // Destructure new prop
  isMaximized, // Destructure new prop
}: PlayerDisplayProps) {
  const youtubeEmbedUrl = playerType === 'youtube' ? getYouTubeEmbedUrl(inputUrl) : null;
  // Spotify embed is removed, so no spotifyEmbedUrl needed here

  // Determine the aspect ratio class based on playerType
  const aspectRatioClass = playerType === 'youtube' ? 'aspect-video' : playerType === 'spotify' ? 'aspect-square' : '';

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
          className={cn(className, 'w-full h-full')} // Audio tag should fill its container
        >
          Your browser does not support the audio element.
        </audio>
      )}
      {(playerType === 'youtube' && youtubeEmbedUrl) && (
        <div className={cn(
          "relative w-full overflow-hidden", // Removed mb-1
          className,
          aspectRatioClass, // Always apply aspect ratio
          isMaximized ? 'mx-auto' : '' // Center horizontally when maximized
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
      {/* Spotify embed removed from here. Its functionality will be handled by the SDK. */}
    </>
  );
}