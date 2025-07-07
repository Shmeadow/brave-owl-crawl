"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedBackgroundPreviewItemProps {
  videoUrl: string;
  isActive: boolean;
  onClick: (url: string, isVideo: boolean) => void;
  previewOffset?: number; // New prop for preview start time
}

export function AnimatedBackgroundPreviewItem({ videoUrl, isActive, onClick, previewOffset }: AnimatedBackgroundPreviewItemProps) {
  const [videoError, setVideoError] = useState(false);
  const videoElementRef = useRef<HTMLVideoElement>(null); // Ref for the video element

  const handleVideoError = () => {
    setVideoError(true);
    console.error(`Failed to load video preview for: ${videoUrl}`);
  };

  // Set the video's current time to the offset when it's ready to play
  const handleLoadedData = () => {
    const video = videoElementRef.current;
    if (video && previewOffset !== undefined) {
      video.currentTime = previewOffset;
    }
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
          ref={videoElementRef} // Assign ref to video element
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          preload="auto" // Changed from "metadata" to "auto"
          muted
          loop // Loop the preview
          playsInline
          onError={handleVideoError}
          onLoadedData={handleLoadedData} // Call handler when enough data is loaded
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
      {!videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          <ImageIcon className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}