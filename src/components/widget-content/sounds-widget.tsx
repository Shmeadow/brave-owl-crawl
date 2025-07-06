"use client";

import React from "react";
import { SoundPlayer } from "@/components/sound-player"; // Import the new SoundPlayer component

interface SoundsWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function SoundsWidget({ isCurrentRoomWritable }: SoundsWidgetProps) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <SoundPlayer isCurrentRoomWritable={isCurrentRoomWritable} />
    </div>
  );
}