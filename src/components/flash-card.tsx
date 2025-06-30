"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onClick: () => void;
}

export function FlashCard({ front, back, isFlipped, onClick }: FlashCardProps) {
  return (
    <Card
      className={cn(
        "relative w-full max-w-md h-64 cursor-pointer",
        "transition-transform duration-500 ease-in-out",
        isFlipped ? "rotate-y-180" : "",
        "overflow-hidden"
      )}
      onClick={onClick}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className={cn(
          "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
          "bg-card text-card-foreground shadow-md",
          "z-[1]" // Front on top when not flipped
        )}
      >
        <CardContent className="flex items-center justify-center h-full text-xl font-semibold">
          {front}
        </CardContent>
      </div>
      <div
        className={cn(
          "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
          "bg-primary text-primary-foreground shadow-md",
          "rotate-y-180",
          "z-[0]" // Back below front when not flipped
        )}
      >
        <CardContent className="flex items-center justify-center h-full text-xl font-semibold">
          {back}
        </CardContent>
      </div>
    </Card>
  );
}