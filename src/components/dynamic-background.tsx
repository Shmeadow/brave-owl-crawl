"use client";

import React from 'react';
import { useBackground } from '@/context/background-provider';

export function DynamicBackground() {
  const { backgroundUrl, isVideo } = useBackground();

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-background">
      {isVideo ? (
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