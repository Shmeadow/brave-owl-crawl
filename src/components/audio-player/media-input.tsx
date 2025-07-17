"use client";

import React from 'react';
import { Button } from '@/components/ui/button'; // Import Button for consistency

interface MediaInputProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  onLoadMedia: () => void;
  onClosePopover: () => void; // New prop to close the popover from within
}

export function MediaInput({ inputUrl, setInputUrl, onLoadMedia, onClosePopover }: MediaInputProps) {
  const handleLoadAndClose = () => {
    onLoadMedia();
    onClosePopover(); // Close popover after loading media
  };

  return (
    <div className="flex flex-col gap-1"> {/* Reduced gap */}
      <input
        type="text"
        id="media-url"
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        placeholder="YouTube or Spotify link" // Simplified placeholder
        className="w-full p-1 text-xs border border-border rounded-md focus:ring-primary focus:border-primary bg-background text-foreground placeholder-muted-foreground"
      />
      <Button
        onClick={handleLoadAndClose}
        className="w-full text-xs py-1 px-2 h-7" // Made button smaller
        size="sm"
      >
        Load Media
      </Button>
    </div>
  );
}