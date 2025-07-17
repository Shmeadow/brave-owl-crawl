"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Link } from "lucide-react"; // Import Link icon

export function MediaWidget() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-8">
      <Music className="h-20 w-20 text-primary mb-4" />
      <h2 className="text-3xl font-bold mb-4 text-foreground text-center">Your Media Hub</h2>
      <p className="text-muted-foreground text-center mb-6">
        Embed YouTube videos, Spotify tracks, or audio files to set your perfect ambiance.
      </p>
      <p className="text-sm text-muted-foreground text-center flex items-center gap-1">
        Click the <Link className="h-4 w-4 inline-block" /> "Embed URL" button on the player to get started!
      </p>
    </div>
  );
}