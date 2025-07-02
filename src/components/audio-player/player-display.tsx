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
}: PlayerDisplayProps) {
  const youtubeEmbedUrl = playerType === 'youtube' ? getYouTubeEmbedUrl(inputUrl) : null;
  const spotifyEmbedUrl = playerType === 'spotify' ? getSpotifyEmbedUrl(inputUrl) : null;

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
          className={className} // Apply className here
        >
          Your browser does not support the audio element.
        </audio>
      )}
      {playerType === 'youtube' && youtubeEmbedUrl && (
        <div className={cn("relative w-full aspect-video mb-1", className)}> {/* Apply className here */}
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
      {playerType === 'spotify' && spotifyEmbedUrl && (
        <div className={cn("relative w-full aspect-square mb-1", className)}> {/* Apply className here */}
          <iframe
            src={spotifyEmbedUrl}
            width="100%"
            height="100%"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-lg"
            style={{ backgroundColor: 'transparent' }}
            title="Spotify Embed"
          ></iframe>
        </div>
      )}
    </>
  );
}