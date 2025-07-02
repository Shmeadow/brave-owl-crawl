"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMediaPlayer } from '@/components/media-player-context';

interface SpotifyPlayerBarProps {
  spotifyEmbedUrl: string | null;
}

export function SpotifyPlayerBar({ spotifyEmbedUrl }: SpotifyPlayerBarProps) {
  const { activePlayer, setActivePlayer } = useMediaPlayer();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // When Spotify is the active player, ensure its iframe is visible/loaded.
  // When another player is active, you might want to hide/unload Spotify.
  // However, direct control over Spotify iframe (play/pause) is not possible.
  // The user will need to interact with the iframe directly.
  useEffect(() => {
    if (spotifyEmbedUrl && activePlayer === 'spotify') {
      // If Spotify is the active player, ensure its iframe is loaded.
      // No programmatic play/pause here, as it's not supported by embed API.
    } else if (spotifyEmbedUrl && activePlayer !== 'spotify') {
      // If another player is active, you might want to pause Spotify.
      // But since we can't control it, the best we can do is inform the user.
      // Or, if the iframe is hidden, it might naturally pause in some browsers.
    }
  }, [activePlayer, spotifyEmbedUrl]);

  // Function to manually set Spotify as active player (e.g., if user clicks inside iframe)
  // This is a heuristic, as we can't detect iframe's internal play state directly.
  const handleIframeFocus = () => {
    if (activePlayer !== 'spotify') {
      setActivePlayer('spotify');
    }
  };

  if (!spotifyEmbedUrl) {
    return null; // Don't render if no Spotify URL is set
  }

  return (
    <Card
      className={cn(
        "fixed top-20 right-4 z-[1000]", // Positioned top-right, below header
        "w-80 h-32", // Fixed width and height for the embed
        "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg", // Glass effect
        "flex flex-col justify-between px-2 py-2 transition-all duration-300 ease-in-out",
        activePlayer === 'spotify' ? 'border-primary' : 'border-transparent' // Highlight if active
      )}
      // Consider adding an onClick to bring to front and set as active,
      // but it might interfere with iframe interaction.
      // For now, rely on the user manually setting it active via the SoundsWidget.
    >
      <CardContent className="relative z-10 flex flex-col justify-between h-full p-0">
        <div className="relative w-full h-full">
          <iframe
            ref={iframeRef}
            src={spotifyEmbedUrl}
            width="100%"
            height="100%"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="absolute top-0 left-0 w-full h-full rounded-md"
            title="Spotify Player"
            // Add an onFocus handler if possible, but iframes are tricky
            // onFocus={handleIframeFocus} // This might not work reliably
          ></iframe>
        </div>
      </CardContent>
      <p className="text-xs text-muted-foreground text-center mt-1">
        (Use controls within the player for playback and volume)
      </p>
    </Card>
  );
}