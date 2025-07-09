"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, throttle } from "@/lib/utils";
import { CardData } from "@/hooks/flashcards/types";

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onClick: () => void;
  status: CardData['status'];
  seen_count: number;
}

export function FlashCard({ front, back, isFlipped, onClick, status, seen_count }: FlashCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const currentCardElement = cardRef.current;
    if (!currentCardElement) return;

    const { left, top, width, height } = currentCardElement.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const relativeX = (mouseX - centerX) / (width / 2);
    const relativeY = (mouseY - centerY) / (height / 2);

    const maxRotation = 5;
    const rotateY = relativeX * maxRotation;
    const rotateX = -relativeY * maxRotation;

    setRotation({ x: rotateX, y: rotateY });
  };

  // Throttling the mouse move event to improve performance
  const throttledMouseMove = useRef(throttle(handleMouseMove, 16)).current; // Limit to ~60fps

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative w-full max-w-md h-60 cursor-pointer",
        "overflow-hidden",
        "transition-transform duration-100 ease-out",
        "hover:scale-[1.01] hover:shadow-lg",
        "hover:shadow-[0_0_15px_5px_hsl(var(--gold))] transition-shadow"
      )}
      onClick={onClick}
      onMouseMove={throttledMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
      }}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 ease-in-out",
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
        }}
      >
        {/* Front Face */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg flex flex-col p-4",
            "bg-card backdrop-blur-xl border-white/20 text-card-foreground shadow-md",
          )}
        >
          <CardContent className="flex-grow flex items-center justify-center text-center text-xl font-semibold">
            {front}
          </CardContent>
          <div className="flex-shrink-0 flex justify-between items-center text-xs text-muted-foreground border-t pt-2">
            <span>Status: <span className="font-semibold capitalize">{status}</span></span>
            <span>Seen: {seen_count} times</span>
          </div>
        </div>

        {/* Back Face */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
            "bg-primary/80 text-primary-foreground shadow-md backdrop-blur-xl",
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          <CardContent className="flex items-center justify-center h-full text-xl font-semibold">
            {back}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}