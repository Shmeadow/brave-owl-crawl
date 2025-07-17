"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon } from "lucide-react";
import { useBackground } from "@/context/background-provider";
import { useEffects } from "@/context/effect-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { staticImages, animatedBackgrounds } from "@/lib/backgrounds";
import { AnimatedBackgroundPreviewItem } from "./animated-background-preview-item";
import Image from "next/image";

export function BackgroundEffectsMenu() {
  const { background, setBackground } = useBackground();
  const { activeEffect, setEffect } = useEffects();

  const handleBackgroundChange = (url: string, isVideo: boolean) => {
    setBackground(url, isVideo);
  };

  return (
    <div className="p-4"> {/* Added p-4 to the main div for internal padding */}
      <h3 className="text-lg font-semibold mb-4">Background Effects</h3>

      <Tabs defaultValue="static-images" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="static-images">Static</TabsTrigger>
          <TabsTrigger value="animated-backgrounds">Animated</TabsTrigger>
          <TabsTrigger value="visual-effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="static-images" className="mt-4">
          <ScrollArea className="h-[380px] p-2"> {/* Adjusted height to h-[380px] and padding to p-2 */}
            <div className="grid grid-cols-2 gap-4">
              {staticImages.map((imageUrl) => {
                const isActive = !background.isVideo && background.url === imageUrl;
                return (
                  <div
                    key={imageUrl}
                    className={`relative w-full h-24 cursor-pointer rounded-md overflow-hidden group ${
                      isActive
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : "hover:ring-2 hover:ring-gray-300"
                    }`}
                    onClick={() => handleBackgroundChange(imageUrl, false)}
                  >
                    <Image
                      src={imageUrl}
                      alt={`Background ${imageUrl.split("/").pop()}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      // No changes to Image component props, as they are standard for local static images
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 text-white text-sm font-bold">
                        Active
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="animated-backgrounds" className="mt-4">
          <ScrollArea className="h-[380px] p-2"> {/* Adjusted height to h-[380px] and padding to p-2 */}
            <div className="grid grid-cols-2 gap-4">
              {animatedBackgrounds.map((bg) => (
                <AnimatedBackgroundPreviewItem
                  key={bg.videoUrl}
                  videoUrl={bg.videoUrl}
                  isActive={background.isVideo && background.url === bg.videoUrl}
                  onClick={handleBackgroundChange}
                  previewOffset={bg.previewOffset}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="visual-effects" className="mt-4">
          <div className="flex flex-col gap-2">
            <Button
              variant={activeEffect === 'none' ? 'default' : 'outline'}
              onClick={() => setEffect('none')}
            >
              No Effect
            </Button>
            <Button
              variant={activeEffect === 'rain' ? 'default' : 'outline'}
              onClick={() => setEffect('rain')}
            >
              Rain Effect
            </Button>
            <Button
              variant={activeEffect === 'snow' ? 'default' : 'outline'}
              onClick={() => setEffect('snow')}
            >
              Snow Effect
            </Button>
            <Button
              variant={activeEffect === 'raindrops' ? 'default' : 'outline'}
              onClick={() => setEffect('raindrops')}
            >
              Raindrops Effect
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}