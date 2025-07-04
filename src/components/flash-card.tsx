"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onClick: () => void;
}

export function FlashCard({ front, back, isFlipped, onClick }: FlashCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const currentCardElement = cardRef.current; // Capture the current value of the ref
    if (!currentCardElement) return; // Ensure the element exists

    const { left, top, width, height } = currentCardElement.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Calculate relative position from center (-1 to 1)
    const relativeX = (mouseX - centerX) / (width / 2);
    const relativeY = (mouseY - centerY) / (height / 2);

    // Map to rotation degrees (e.g., -5 to 5)
    const maxRotation = 5; // degrees for subtle wobble
    const rotateY = relativeX * maxRotation; // Mouse X affects Y-axis rotation
    const rotateX = -relativeY * maxRotation; // Mouse Y affects X-axis rotation (inverted for natural feel)

    setRotation({ x: rotateX, y: rotateY });
  };

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
        "hover:shadow-[0_0_15px_5px_hsl(var(--gold))] transition-shadow" // Subtle golden shadow effect on hover
      )}
      onClick={onClick}
      onMouseMove={handleMouseMove}
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
            "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
            "bg-card backdrop-blur-xl border-white/20 text-card-foreground shadow-md",
          )}
        >
          <CardContent className="flex items-center justify-center h-full text-xl font-semibold">
            {front}
          </CardContent>
        </div>

        {/* Back Face */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
            "bg-primary text-primary-foreground shadow-md backdrop-blur-xl", // Added backdrop-blur-xl
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