"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Star, CheckCircle } from "lucide-react";
import { FlashcardSize } from "@/hooks/use-flashcard-size"; // Import FlashcardSize type
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface FlashCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onClick: () => void;
  status?: string;
  seen_count?: number;
  size?: FlashcardSize; // Add size prop
  onSetSize?: (size: FlashcardSize) => void; // Add onSetSize prop
}

export function FlashCard({ front, back, isFlipped, onClick, status, seen_count, size = 'md', onSetSize }: FlashCardProps) {
  const cardClasses = cn(
    "relative w-full cursor-pointer transition-all duration-500 ease-in-out",
    {
      'h-[250px] max-w-[400px]': size === 'sm',
      'h-[350px] max-w-[550px]': size === 'md',
      'h-[450px] max-w-[700px]': size === 'lg',
    }
  );

  const innerCardClasses = cn(
    "relative w-full h-full text-center transition-transform duration-500 ease-in-out"
    // Removed { "rotate-y-180": isFlipped } from here
  );

  const frontBackBaseClasses = "absolute inset-0 w-full h-full flex flex-col justify-center items-center rounded-lg shadow-lg p-4";

  const textSizeClasses = cn({
    'text-4xl': size === 'sm',
    'text-5xl': size === 'md',
    'text-6xl': size === 'lg',
  });

  const statusIndicatorClasses = cn(
    "absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full",
    status === 'Mastered' && "bg-green-500 text-white",
    status === 'Advanced' && "bg-blue-500 text-white",
    status === 'Intermediate' && "bg-purple-500 text-white",
    status === 'Beginner' && "bg-orange-500 text-white",
    status === 'Learning' && "bg-red-500 text-white",
  );

  return (
    <div className={cardClasses} style={{ perspective: '1000px' }}>
      <div
        className={innerCardClasses}
        onClick={onClick}
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }} // Directly apply transform here
      >
        {/* Front of the card (Question - Dark) */}
        <div
          className={cn(frontBackBaseClasses, "bg-primary text-primary-foreground border border-white/20")}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col items-center justify-center h-full w-full p-0">
            <p className={cn("font-semibold", textSizeClasses)}>{front}</p>
            {status && (
              <span className={statusIndicatorClasses}>{status}</span>
            )}
            {seen_count !== undefined && seen_count > 0 && (
              <span className="absolute bottom-2 right-2 text-xs text-primary-foreground/70">
                Views: {seen_count}
              </span>
            )}
          </div>
        </div>

        {/* Back of the card (Answer - Light) */}
        <div
          className={cn(frontBackBaseClasses, "bg-card text-card-foreground border border-white/20")}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex flex-col items-center justify-center h-full w-full p-0">
            <p className={cn("font-medium", textSizeClasses)}>{back}</p>
            {status && (
              <span className={statusIndicatorClasses}>{status}</span>
            )}
            {seen_count !== undefined && seen_count > 0 && (
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                Views: {seen_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {onSetSize && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 p-1 rounded-md shadow-sm z-10">
          <Label htmlFor="flashcard-size" className="sr-only">Flashcard Size</Label>
          <ToggleGroup type="single" value={size} onValueChange={(value: FlashcardSize) => onSetSize(value)} className="h-auto">
            <ToggleGroupItem value="sm" aria-label="Small" className="h-8 px-3 text-sm">
              S
            </ToggleGroupItem>
            <ToggleGroupItem value="md" aria-label="Medium" className="h-8 px-3 text-sm">
              M
            </ToggleGroupItem>
            <ToggleGroupItem value="lg" aria-label="Large" className="h-8 px-3 text-sm">
              L
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}