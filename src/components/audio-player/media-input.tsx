"use client";

import React from 'react';
import { Link } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button for consistency

interface MediaInputProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  onLoadMedia: () => void;
  // Removed onClosePopover prop
}

export function MediaInput({ inputUrl, setInputUrl, onLoadMedia }: MediaInputProps) {
  const handleLoadAndClose = () => {
    onLoadMedia();
    // Removed onClosePopover call
  };

  return (
    <div className="p-2 bg-muted rounded-lg border border-border shadow-md">
      <label htmlFor="media-url" className="block text-xs font-medium text-muted-foreground mb-1">
        Embed URL:
      </label>
      <input
        type="text"
        id="media-url"
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
        placeholder="e.g., YouTube or Spotify link"
        className="w-full p-1 text-xs border border-border rounded-md focus:ring-primary focus:border-primary mb-2 bg-background text-foreground placeholder-muted-foreground"
      />
      <Button
        onClick={handleLoadAndClose}
        className="w-full text-xs py-1 px-2" // Use Shadcn Button
        size="sm"
      >
        Load Media
      </Button>
    </div>
  );
}