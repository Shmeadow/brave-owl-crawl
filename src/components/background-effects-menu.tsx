"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BackgroundGradient, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const staticImages = [
  "/bg1.jpg",
  "/bg2.jpg",
  "/bg3.jpg",
  "/bg4.jpg",
  "/bg5.jpg",
];

const animatedBackgrounds = [
  { videoUrl: "/ani1.mp4", thumbnailUrl: "/ani1.jpg" },
  { videoUrl: "/ani2.mp4", thumbnailUrl: "/ani2.jpg" },
  { videoUrl: "/ani3.mp4", thumbnailUrl: "/ani3.jpg" },
  { videoUrl: "/ani4.mp4", thumbnailUrl: "/ani4.jpg" }, // Added ani4
  { videoUrl: "/ani5.mp4", thumbnailUrl: "/ani5.jpg" }, // Added ani5
];

export function BackgroundEffectsMenu() {
  const [background, setBackground] = useState<{
    isVideo: boolean;
    url: string;
  }>(() => {
    if (typeof window !== "undefined") {
      const storedBackground = localStorage.getItem("background");
      return storedBackground
        ? JSON.parse(storedBackground)
        : { isVideo: false, url: "/bg1.jpg" };
    }
    return { isVideo: false, url: "/bg1.jpg" };
  });

  useEffect(() => {
    localStorage.setItem("background", JSON.stringify(background));
    document.body.style.backgroundImage = background.isVideo
      ? "none"
      : `url(${background.url})`;
    document.body.style.backgroundSize = background.isVideo ? "auto" : "cover";
    document.body.style.backgroundPosition = background.isVideo
      ? "auto"
      : "center center";
    document.body.style.backgroundRepeat = background.isVideo
      ? "auto"
      : "no-repeat";

    const videoElement = document.getElementById(
      "background-video"
    ) as HTMLVideoElement;
    if (videoElement) {
      if (background.isVideo) {
        videoElement.src = background.url;
        videoElement.style.display = "block";
        videoElement.play().catch((e) => console.error("Video play failed:", e));
      } else {
        videoElement.style.display = "none";
        videoElement.pause();
      }
    }
  }, [background]);

  const handleBackgroundChange = (url: string, isVideo: boolean) => {
    setBackground({ isVideo, url });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <BackgroundGradient className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-4">
        <h3 className="text-lg font-semibold mb-4">Background Effects</h3>

        <div className="mb-6">
          <h4 className="text-md font-medium mb-2">Static Images</h4>
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
                    <Image
                      src={imageUrl}
                      alt={`Background ${imageUrl.split("/").pop()}`}
                      layout="fill"
                      className="object-cover" // Added object-cover
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
        </div>

        <div>
          <h4 className="text-md font-medium mb-2">Animated Backgrounds</h4>
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
                    <Image
                      src={thumbnailUrl}
                      alt={`Animated Background ${videoUrl.split("/").pop()}`}
                      layout="fill"
                      className="object-cover" // Added object-cover
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}