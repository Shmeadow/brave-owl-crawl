"use client";

import React from 'react';
import { useBackground } from '@/context/background-provider';
import { getYouTubeEmbedUrl } from '@/lib/utils';

export function DynamicBackground() {
  const { backgroundUrl, isVideo } = useBackground();

  const isYouTube = isVideo && (backgroundUrl.includes('youtube.com') || backgroundUrl.includes('youtu.be'));
  const youtubeEmbedUrl = isYouTube ? getYouTubeEmbedUrl(backgroundUrl) : null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background">
      {isYouTube && youtubeEmbedUrl ? (
        <iframe
          key={backgroundUrl}
          src={youtubeEmbedUrl}
          className="absolute top-1/2 left-1/2 w-screen h-[56.25vw] min-h-screen min-w-[177.77vh] transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          title="YouTube Background"
        ></iframe>
      ) : isVideo ? (
        <video
          key={backgroundUrl}
          src={backgroundUrl}
          className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto object-cover transform -translate-x-1/2 -translate-y-1/2"
          autoPlay
          loop
          muted
          playsInline
          onError={() => console.error(`Failed to load video: ${backgroundUrl}`)}
        />
      ) : (
        <img
          key={backgroundUrl}
          src={backgroundUrl}
          alt="Background"
          className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto object-cover transform -translate-x-1/2 -translate-y-1/2"
          onError={() => console.error(`Failed to load image: ${backgroundUrl}`)}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: `blur(var(--background-blur-px))`
        }}
      />
    </div>
  );
}