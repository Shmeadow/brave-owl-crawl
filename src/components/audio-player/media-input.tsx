"use client";

import React from 'react';
import { Link } from 'lucide-react'; // Added missing import

interface MediaInputProps {
  inputUrl: string;
  setInputUrl: (url: string) => void;
  showUrlInput: boolean;
  setShowUrlInput: (show: boolean) => void;
  onLoadMedia: () => void;
}

export function MediaInput({ inputUrl, setInputUrl, showUrlInput, setShowUrlInput, onLoadMedia }: MediaInputProps) {
  return (
    <>
      <button
        onClick={() => setShowUrlInput((prev: boolean) => !prev)}
        className="text-xs font-bold text-primary hover:underline mt-0.5 flex items-center"
        title="Change Media URL"
      >
        <Link size={12} className="mr-0.5" />
        {showUrlInput ? 'Hide URL' : 'Embed URL'}
      </button>

      {showUrlInput && (
        <div className="mt-1 p-1 bg-muted rounded-lg border border-border">
          <label htmlFor="media-url" className="block text-xs font-medium text-muted-foreground mb-0.5">
            Embed URL:
          </label>
          <input
            type="text"
            id="media-url"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="e.g., YouTube or Spotify link"
            className="w-full p-0.5 text-xs border border-border rounded-md focus:ring-primary focus:border-primary mb-1 bg-background text-foreground placeholder-muted-foreground"
          />
          <button
            onClick={onLoadMedia}
            className="w-full bg-primary text-primary-foreground text-xs py-0.5 px-1 rounded-md hover:bg-primary/90 transition duration-300 shadow-xs"
          >
            Load Media
          </button>
        </div>
      )}
    </>
  );
}