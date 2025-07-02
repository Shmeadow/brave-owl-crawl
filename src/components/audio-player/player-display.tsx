"use client";

import React from 'react';
import { getYouTubeEmbedUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PlayerDisplayProps {
  playerType: 'audio' | 'youtube' | 'spotify' | null;
  inputUrl: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  youtubeIframeRef: React.RefObject<HTMLIFrameElement>;
  onLoadedMetadata: () => void;
  onTimeUpdate: () => void;
  onEnded: () => void;
  className?: string;
  // isMaximized prop was not used in the component's logic
}

export function PlayerDisplay({
  playerType,
  inputUrl,
  audioRef,
  youtubeIframeRef,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  className,
}: PlayerDisplayProps) {
  const youtubeEmbedUrl = playerType === 'youtube' ? getYouTubeEmbedUrl(inputUrl) : null;

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
          className={cn(className, 'w-full h-full')}
        >
          Your browser does not support the audio element.
        </audio>
      )}
      {(playerType === 'youtube' && youtubeEmbedUrl) && (
        <div className={cn(
          "relative w-full overflow-hidden",
          className,
          aspectRatioClass
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
    </>
  );
}