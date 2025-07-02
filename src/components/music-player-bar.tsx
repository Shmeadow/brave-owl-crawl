"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Youtube, Music } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_YOUTUBE_EMBED_KEY = 'youtube_embed_url';

export function MusicPlayerBar() {
  const [youtubeEmbedUrl, setYoutubeEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setYoutubeEmbedUrl(localStorage.getItem(LOCAL_STORAGE_YOUTUBE_EMBED_KEY));
    }
  }, []);

  if (!youtubeEmbedUrl) {
    return (
      <div
        className={cn(
          "fixed top-24 right-4 z-30 transition-all duration-300 ease-in-out",
          "w-64"
        )}
      >
        <Card className="bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden h-auto p-3">
          <CardContent className="flex flex-col gap-2 p-0 items-center justify-center text-center h-full min-h-[100px]">
            <Music className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No YouTube video embedded.</p>
            <p className="text-xs text-muted-foreground">Go to Sounds widget to add one.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed top-24 right-4 z-30 transition-all duration-300 ease-in-out",
        "w-64"
      )}
    >
      <Card
        className={cn(
          "bg-card/40 backdrop-blur-xl border-white/20 shadow-lg rounded-lg flex flex-col overflow-hidden",
          "h-auto p-3"
        )}
      >
        <CardContent className="flex flex-col gap-2 p-0">
          <div className="flex items-center gap-2 justify-center">
            <Youtube className="h-6 w-6 text-red-500" />
            <span className="font-semibold text-sm">YouTube Player</span>
          </div>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
            <iframe
              src={youtubeEmbedUrl}
              width="100%"
              height="100%"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              className="absolute top-0 left-0 w-full h-full rounded-md"
            ></iframe>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Controls are within the YouTube player.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}