"use client";

import React from 'react';
import { getYouTubeEmbedUrl, getSpotifyEmbedUrl } from '@/lib/utils';

interface PlayerDisplayProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  inputUrl: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  youtubeIframeRef: React.RefObject<HTMLIFrameElement>; // New prop for YouTube iframe ref
  // New props for HTML audio event handlers
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
}

export function PlayerDisplay({
  playerType,
  inputUrl,
  audioRef,
  youtubeIframeRef, // Destructure new prop
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
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
        >
          Your browser does not support the audio element.
        </audio>
      )}
      {playerType === 'youtube' && youtubeEmbedUrl && (
        <div className="relative w-full aspect-video mb-1">
          <iframe
            ref={youtubeIframeRef} // Pass the ref here
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
        <div className="relative w-full aspect-square mb-1">
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