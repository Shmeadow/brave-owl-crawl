"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBackground } from "@/context/background-provider";
import { useEffects } from "@/context/effect-provider";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const staticImages = Array.from({ length: 6 }, (_, i) => `/bg${i + 1}.jpg`);
const animatedImages = Array.from({ length: 3 }, (_, i) => `/ani${i + 1}.mp4`);

interface BackgroundEffectsWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function BackgroundEffectsWidget({ isCurrentRoomWritable }: BackgroundEffectsWidgetProps) {
  const { background, setBackground } = useBackground();
  const { activeEffect, setEffect } = useEffects();

  return (
    <div className="h-full w-full flex flex-col">
      <Tabs defaultValue="static" className="w-full flex flex-col flex-1 p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="static">Static</TabsTrigger>
          <TabsTrigger value="animated">Animated</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
        </TabsList>
        <TabsContent value="static" className="flex-1 mt-4">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pr-4">
              {staticImages.map((src) => {
                const isActive = !background.isVideo && background.url === src;
                return (
                  <div
                    key={src}
                    className={cn(
                      "relative aspect-video cursor-pointer rounded-md overflow-hidden group",
                      isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => setBackground(src, false)}
                  >
                    <Image
                      src={src}
                      alt={`Background ${src}`}
                      fill
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    {isActive && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="animated" className="flex-1 mt-4">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pr-4">
              {animatedImages.map((src) => {
                const isActive = background.isVideo && background.url === src;
                return (
                  <div
                    key={src}
                    className={cn(
                      "relative aspect-video cursor-pointer rounded-md overflow-hidden group bg-black",
                      isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    onClick={() => setBackground(src, true)}
                  >
                    <video
                      src={src}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                    {isActive && (
                      <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="effects" className="flex-1 mt-4">
          <div className="flex flex-col gap-4">
            <Button
              variant={activeEffect === 'none' ? 'default' : 'outline'}
              onClick={() => setEffect('none')}
            >
              None
            </Button>
            <Button
              variant={activeEffect === 'particles' ? 'default' : 'outline'}
              onClick={() => setEffect('particles')}
            >
              Floating Particles
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}