"use client";

import React from "react";
import { FlashcardApp } from "@/components/flashcards/FlashcardApp"; // Import the new main component

interface FlashCardsWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function FlashCardsWidget({ isCurrentRoomWritable }: FlashCardsWidgetProps) {
  return (
    <div className="h-full w-full flex flex-col flex-1 py-4">
      <FlashcardApp isCurrentRoomWritable={isCurrentRoomWritable} />
    </div>
  );
}