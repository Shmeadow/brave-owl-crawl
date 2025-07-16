"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, throttle } from "@/lib/utils";
import { CardData } from "@/hooks/flashcards/types";
import { FlashcardSize } from "@/hooks/use-flashcard-size"; // Import type
import { Button } from "@/components/ui/button"; // Import Button

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onClick: () => void;
  status: CardData['status'];
  seen_count: number;
  size?: FlashcardSize;
  onSetSize?: (size: FlashcardSize) => void; // New prop for setting size
}

export function FlashCard({ front, back, isFlipped, onClick, status, seen_count, size = 'M', onSetSize }: FlashCardProps) {
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

  const sizeClasses = {
    S: 'h-56',
    M: 'h-72',
    L: 'h-80',
  };

  const contentSizeClasses = {
    S: 'text-xl',
    M: 'text-2xl',
    L: 'text-3xl',
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        "relative w-full max-w-md cursor-pointer",
        "overflow-hidden",
        "transition-all duration-100 ease-out",
        "hover:scale-[1.01] hover:shadow-lg",
        "hover:shadow-[0_0_15px_5px_hsl(var(--gold))] transition-shadow",
        sizeClasses[size]
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
          <CardContent className={cn("flex-grow flex items-center justify-center text-center font-semibold", contentSizeClasses[size])}>
            {front}
          </CardContent>
          <div className="flex-shrink-0 flex justify-between items-center text-xs text-muted-foreground border-t pt-2">
            <span>Status: <span className="font-semibold capitalize">{status}</span></span>
            <span>Seen: {seen_count} times</span>
          </div>
          {onSetSize && (
            <div className="absolute top-2 right-2 flex gap-1 z-10">
              <Button
                variant={size === 'S' ? 'default' : 'outline'}
                // size="xs" // Removed invalid size prop
                className="h-6 w-6 text-xs p-0"
                onClick={(e) => { e.stopPropagation(); onSetSize('S'); }}
              >
                S
              </Button>
              <Button
                variant={size === 'M' ? 'default' : 'outline'}
                // size="xs" // Removed invalid size prop
                className="h-6 w-6 text-xs p-0"
                onClick={(e) => { e.stopPropagation(); onSetSize('M'); }}
              >
                M
              </Button>
              <Button
                variant={size === 'L' ? 'default' : 'outline'}
                // size="xs" // Removed invalid size prop
                className="h-6 w-6 text-xs p-0"
                onClick={(e) => { e.stopPropagation(); onSetSize('L'); }}
              >
                L
              </Button>
            </div>
          )}
        </div>

        {/* Back Face */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
            "bg-primary/80 text-primary-foreground shadow-md backdrop-blur-xl",
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          <CardContent className={cn("flex items-center justify-center h-full font-semibold", contentSizeClasses[size])}>
            {back}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}