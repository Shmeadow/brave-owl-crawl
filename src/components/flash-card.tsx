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
    if (!cardRef.current) return;

    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
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
        "relative w-full max-w-md h-60 cursor-pointer", // Adjusted height to h-60
        "overflow-hidden",
        "transition-transform duration-100 ease-out", // Transition for the wobble effect
        "hover:scale-[1.01] hover:shadow-lg" // Added hover effects
      )}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px', // Perspective remains on the parent
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`, // Apply wobble transform
      }}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 ease-in-out",
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" // Explicitly control rotation here
        }}
      >
        {/* Front Face */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
            "bg-card text-card-foreground shadow-md",
          )}
        >
          <CardContent className="flex items-center justify-center h-full text-xl font-semibold"> {/* Changed text-lg to text-xl */}
            {front}
          </CardContent>
        </div>

        {/* Back Face */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full backface-hidden rounded-lg flex items-center justify-center p-4 text-center",
            "bg-primary text-primary-foreground shadow-md",
          )}
          style={{ transform: "rotateY(180deg)" }} // Explicitly rotate the back face
        >
          <CardContent className="flex items-center justify-center h-full text-xl font-semibold"> {/* Changed text-lg to text-xl */}
            {back}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}