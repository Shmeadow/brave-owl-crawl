"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gamepad2, Hash, Layers } from "lucide-react";

// Updated URLs to point directly to the game content, bypassing the "Run Game" button.
const games = [
  { name: 'Super Ness', icon: Gamepad2, url: 'https://v6p9d9t4.ssl.hwcdn.net/html/9981985/index.html' },
  { name: 'Tower Wizard', icon: Layers, url: 'https://v6p9d9t4.ssl.hwcdn.net/html/9979698/index.html' },
  { name: 'Retromine', icon: Hash, url: 'https://v6p9d9t4.ssl.hwcdn.net/html/9979692/index.html' },
];

export function GamesWidget() {
  const [selectedGameUrl, setSelectedGameUrl] = useState<string | null>(null);

  if (selectedGameUrl) {
    return (
      <div className="h-full w-full flex flex-col bg-background">
        <div className="p-2 border-b flex-shrink-0">
          <Button variant="ghost" onClick={() => setSelectedGameUrl(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games List
          </Button>
        </div>
        <iframe
          src={selectedGameUrl}
          className="w-full h-full border-0 flex-grow"
          title="Game"
          sandbox="allow-scripts allow-same-origin"
          allow="autoplay" // Added to help games start automatically
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <Card className="w-full h-full bg-card backdrop-blur-xl border-white/20 flex flex-col items-center justify-center">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            Games
          </CardTitle>
        </CardHeader>
        <CardContent className="text-foreground text-center">
          <p className="text-muted-foreground mb-4">Select a game to play.</p>
          <div className="grid grid-cols-2 gap-4">
            {games.map((game) => (
              <Button
                key={game.name}
                variant="outline"
                className="flex flex-col h-24 w-24 items-center justify-center gap-2"
                onClick={() => setSelectedGameUrl(game.url)}
              >
                <game.icon className="h-8 w-8" />
                <span className="text-sm">{game.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}