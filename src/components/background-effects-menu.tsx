"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Image as ImageIcon } from "lucide-react";
import { useBackground } from "@/context/background-provider";
import { useEffects } from "@/context/effect-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const staticImages = [
  "/static/bg1.jpg",
  "/static/bg2.jpg",
  "/static/bg3.jpg",
  "/static/bg4.jpg",
  "/static/bg5.jpg",
  "/static/bg6.jpg",
  "/static/bg7.jpg",
  "/static/bg9.jpg",
  "/static/bg10.jpg",
  "/static/bg11.jpg",
  "/static/bg12.jpg",
];

const animatedBackgrounds = [
  { videoUrl: "/animated/ani1.mp4", thumbnailUrl: "/animated/ani1.jpg" },
  { videoUrl: "/animated/ani2.mp4", thumbnailUrl: "/animated/ani2.jpg" },
  { videoUrl: "/animated/ani3.mp4", thumbnailUrl: "/animated/ani3.jpg" },
  { videoUrl: "/animated/ani4.mp4", thumbnailUrl: "/animated/ani4.jpg" },
  { videoUrl: "/animated/ani5.mp4", thumbnailUrl: "/animated/ani5.jpg" },
  { videoUrl: "/animated/ani6.mp4", thumbnailUrl: "/animated/ani6.jpg" },
  { videoUrl: "/animated/ani7.mp4", thumbnailUrl: "/animated/ani7.jpg" },
  { videoUrl: "/animated/ani8.mp4", thumbnailUrl: "/animated/ani8.jpg" },
  { videoUrl: "/animated/ani9.mp4", thumbnailUrl: "/animated/ani9.jpg" },
  { videoUrl: "/animated/ani10.mp4", thumbnailUrl: "/animated/ani10.jpg" },
  { videoUrl: "/animated/ani11.mp4", thumbnailUrl: "/animated/ani11.jpg" },
  { videoUrl: "/animated/ani12.mp4", thumbnailUrl: "/animated/ani12.jpg" },
  { videoUrl: "/animated/ani13.mp4", thumbnailUrl: "/animated/ani13.jpg" },
  { videoUrl: "/animated/ani14.mp4", thumbnailUrl: "/animated/ani14.jpg" },
  { videoUrl: "/animated/ani15.mp4", thumbnailUrl: "/animated/ani15.jpg" },
  { videoUrl: "/animated/ani16.mp4", thumbnailUrl: "/animated/ani16.jpg" },
  { videoUrl: "/animated/ani17.mp4", thumbnailUrl: "/animated/ani17.jpg" },
  { videoUrl: "/animated/ani18.mp4", thumbnailUrl: "/animated/ani18.jpg" },
  { videoUrl: "/animated/ani19.mp4", thumbnailUrl: "/animated/ani19.jpg" },
  { videoUrl: "/animated/ani20.mp4", thumbnailUrl: "/animated/ani20.jpg" },
  { videoUrl: "/animated/ani21.mp4", thumbnailUrl: "/animated/ani21.jpg" },
];

export function BackgroundEffectsMenu() {
  const { background, setBackground } = useBackground();
  const { activeEffect, setEffect } = useEffects();

  const handleBackgroundChange = (url: string, isVideo: boolean) => {
    setBackground(url, isVideo);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Background Effects</h3>

      <Tabs defaultValue="static-images" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="static-images">Static</TabsTrigger>
          <TabsTrigger value="animated-backgrounds">Animated</TabsTrigger>
          <TabsTrigger value="visual-effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="static-images" className="mt-4">
          <ScrollArea className="h-72">
            <div className="grid grid-cols-2 gap-4 pr-4">
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
                    <img
                      src={imageUrl}
                      alt={`Background ${imageUrl.split("/").pop()}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
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
          <ScrollArea className="h-72">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {animatedBackgrounds.map(({ videoUrl, thumbnailUrl }) => {
                const isActive = background.isVideo && background.url === videoUrl;
                return (
                  <div
                    key={videoUrl}
                    className={`relative w-full h-24 cursor-pointer rounded-md overflow-hidden group ${
                      isActive
                        ? "ring-2 ring-blue-500 ring-offset-2"
                        : "hover:ring-2 hover:ring-gray-300"
                    }`}
                    onClick={() => handleBackgroundChange(videoUrl, true)}
                  >
                    <img
                      src={thumbnailUrl}
                      alt={`Animated background ${videoUrl.split("/").pop()}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="h-6 w-6" />
                    </div>
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