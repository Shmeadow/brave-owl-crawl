"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Music, Play } from 'lucide-react';
import { SimpleAudioPlayer } from './simple-audio-player';
import { availableSounds } from '@/lib/sounds'; // Import the new sounds list
import { cn } from '@/lib/utils';

interface SoundPlayerProps {
  isCurrentRoomWritable: boolean;
}

export function SoundPlayer({ isCurrentRoomWritable }: SoundPlayerProps) {
  const [selectedSoundUrl, setSelectedSoundUrl] = useState<string | null>(null);
  const [selectedSoundType, setSelectedSoundType] = useState<'audio' | 'youtube' | 'spotify' | null>(null);

  const handleSoundSelect = useCallback((url: string, type: 'audio' | 'youtube' | 'spotify') => {
    setSelectedSoundUrl(url);
    setSelectedSoundType(type);
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      <Card className="w-full flex-grow flex flex-col bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-6 w-6" /> Ambient Sounds
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0 flex flex-col">
          <ScrollArea className="flex-grow h-full">
            <div className="p-4 space-y-2">
              {availableSounds.map((sound) => (
                <Button
                  key={sound.url}
                  variant={selectedSoundUrl === sound.url ? 'default' : 'outline'}
                  className={cn(
                    "w-full justify-start",
                    selectedSoundUrl === sound.url && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleSoundSelect(sound.url, sound.type as 'audio')}
                >
                  <Play className="mr-2 h-4 w-4" /> {sound.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="mt-4 p-4 border-t border-border bg-card backdrop-blur-xl rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Now Playing</h3>
        {selectedSoundUrl && selectedSoundType ? (
          <SimpleAudioPlayer
            mediaUrl={selectedSoundUrl}
            mediaType={selectedSoundType}
            isCurrentRoomWritable={isCurrentRoomWritable}
          />
        ) : (
          <p className="text-muted-foreground text-sm text-center">Select a sound to play.</p>
        )}
      </div>
    </div>
  );
}