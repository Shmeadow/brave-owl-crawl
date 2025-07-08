"use client";

import React, { useState, useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundPreviewItemProps {
  videoUrl: string;
  isActive: boolean;
  onClick: (url: string, isVideo: boolean) => void;
  previewOffset?: number;
}

export function AnimatedBackgroundPreviewItem({ videoUrl, isActive, onClick, previewOffset }: AnimatedBackgroundPreviewItemProps) {
  const [videoError, setVideoError] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement>(null);

  const handleVideoError = () => {
    setVideoError(true);
    console.error(`Failed to load video preview for: ${videoUrl}`);
  };

  const handleLoadedData = () => {
    const video = videoElementRef.current;
    if (video && previewOffset !== undefined) {
      video.currentTime = previewOffset;
    }
  };

  return (
    <div
      className={cn(
        "relative w-full h-24 cursor-pointer rounded-md overflow-hidden group bg-muted",
        isActive ? "ring-2 ring-primary ring-offset-2" : "hover:ring-2 hover:ring-primary/50"
      )}
      onClick={() => onClick(videoUrl, true)}
    >
      {!videoError ? (
        <video
          ref={videoElementRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          preload="auto"
          muted
          loop
          playsInline
          onError={handleVideoError}
          onLoadedData={handleLoadedData}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700 text-white text-xs font-semibold p-2 text-center">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span className="text-center">Video Error</span>
        </div>
      )}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary bg-opacity-50 text-white text-sm font-bold">
          Active
        </div>
      )}
    </div>
  );
}