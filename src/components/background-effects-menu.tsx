"use client";

import React from 'react';
import { staticImages, animatedBackgrounds } from '@/lib/backgrounds';
import { useEffects } from '@/context/effect-provider';
import { useBackground } from '@/context/background-provider';
import { Button } from '@/components/ui/button';
import { ImageIcon, VideoIcon, Ban, Droplets, Snowflake } from 'lucide-react';
import { AnimatedBackgroundPreviewItem } from '@/components/animated-background-preview-item';
import { useCurrentRoom } from '@/hooks/use-current-room';
import { toast } from 'sonner';

export function BackgroundEffectsMenu() {
  const { setEffect } = useEffects();
  const { setBackground, backgroundUrl, isVideo } = useBackground();
  const { isCurrentRoomWritable } = useCurrentRoom();

  const handleSetEffect = (effect: 'none' | 'rain' | 'snow' | 'raindrops') => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to change effects in this room.");
      return;
    }
    setEffect(effect);
  };

  const handleSetBackground = (url: string, isVideo: boolean) => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to change the background in this room.");
      return;
    }
    setBackground(url, isVideo);
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Static Backgrounds</h3>
        <div className="grid grid-cols-3 gap-2">
          {staticImages.map((image) => (
            <div key={image.url} onClick={() => handleSetBackground(image.url, false)} className="cursor-pointer relative group">
              <img src={image.url} alt="background" className="w-full h-20 object-cover rounded-md" />
              {backgroundUrl === image.url && !isVideo && <div className="absolute inset-0 bg-primary/50 rounded-md" />}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Animated Backgrounds</h3>
        <div className="grid grid-cols-3 gap-2">
          {animatedBackgrounds.map((video) => (
            <AnimatedBackgroundPreviewItem
              key={video.url}
              videoUrl={video.url}
              isActive={backgroundUrl === video.url && isVideo}
              onClick={handleSetBackground}
              previewOffset={video.previewOffset}
            />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Effects</h3>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => handleSetEffect('none')} variant="outline"><Ban className="mr-2 h-4 w-4" /> None</Button>
          <Button onClick={() => handleSetEffect('rain')} variant="outline"><Droplets className="mr-2 h-4 w-4" /> Rain</Button>
          <Button onClick={() => handleSetEffect('snow')} variant="outline"><Snowflake className="mr-2 h-4 w-4" /> Snow</Button>
        </div>
      </div>
    </div>
  );
}