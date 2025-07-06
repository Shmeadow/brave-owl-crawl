"use client";

import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundPreviewItemProps {
  videoUrl: string;
  isActive: boolean;
  onClick: (url: string, isVideo: boolean) => void;
}

export function AnimatedBackgroundPreviewItem({ videoUrl, isActive, onClick }: AnimatedBackgroundPreviewItemProps) {
  const [videoError, setVideoError] = useState(false);

  const handleVideoError = () => {
    setVideoError(true);
    console.error(`Failed to load video preview for: ${videoUrl}`);
  };

  return (
    <div
      className={cn(
        "relative w-full h-24 cursor-pointer rounded-md overflow-hidden group",
        isActive ? "ring-2 ring-blue-500 ring-offset-2" : "hover:ring-2 hover:ring-gray-300"
      )}
      onClick={() => onClick(videoUrl, true)}
    >
      {!videoError ? (
        <video
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
          onError={handleVideoError}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-700 text-white text-xs font-semibold p-2 text-center">
          <ImageIcon className="h-6 w-6 mb-1" />
          <span>Video Error</span>
        </div>
      )}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 text-white text-sm font-bold">
          Active
        </div>
      )}
      {/* The original ImageIcon overlay on hover, now only shown if no error */}
      {!videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}