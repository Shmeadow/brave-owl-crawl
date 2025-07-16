"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    "relative w-full cursor-pointer perspective-1000 transition-all duration-500 ease-in-out",
    {
      'h-[250px] max-w-[400px]': size === 'sm', // Increased size
      'h-[350px] max-w-[550px]': size === 'md', // Increased size
      'h-[450px] max-w-[700px]': size === 'lg', // Increased size
    }
  );

  const innerCardClasses = "relative w-full h-full text-center transition-transform duration-500 ease-in-out preserve-3d";
  const frontBackClasses = "absolute w-full h-full flex flex-col justify-center items-center backface-hidden rounded-lg shadow-lg p-4";

  const textSizeClasses = cn({
    'text-base': size === 'sm', // Increased text size
    'text-lg': size === 'md',   // Increased text size
    'text-xl': size === 'lg',   // Increased text size
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
    <div className={cardClasses}>
      <div className={cn(innerCardClasses, { "rotate-y-180": isFlipped })}>
        {/* Front of the card */}
        <Card className={cn(frontBackClasses, "bg-card text-card-foreground border-white/20")}>
          <CardContent className="flex flex-col items-center justify-center h-full w-full p-0">
            <p className={cn("font-semibold", textSizeClasses)}>{front}</p>
            {status && (
              <span className={statusIndicatorClasses}>{status}</span>
            )}
            {seen_count !== undefined && seen_count > 0 && (
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                Views: {seen_count}
              </span>
            )}
          </CardContent>
        </Card>

        {/* Back of the card */}
        <Card className={cn(frontBackClasses, "bg-primary text-primary-foreground rotate-y-180")}>
          <CardContent className="flex flex-col items-center justify-center h-full w-full p-0">
            <p className={cn("font-medium", textSizeClasses)}>{back}</p>
            {status && (
              <span className={statusIndicatorClasses}>{status}</span>
            )}
            {seen_count !== undefined && seen_count > 0 && (
              <span className="absolute bottom-2 right-2 text-xs text-primary-foreground/70">
                Views: {seen_count}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {onSetSize && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 p-1 rounded-md shadow-sm z-10">
          <Label htmlFor="flashcard-size" className="sr-only">Flashcard Size</Label>
          <ToggleGroup type="single" value={size} onValueChange={(value: FlashcardSize) => onSetSize(value)} className="h-auto">
            <ToggleGroupItem value="sm" aria-label="Small" className="h-8 px-3 text-sm"> {/* Increased button size */}
              Small
            </ToggleGroupItem>
            <ToggleGroupItem value="md" aria-label="Medium" className="h-8 px-3 text-sm"> {/* Increased button size */}
              Medium
            </ToggleGroupItem>
            <ToggleGroupItem value="lg" aria-label="Large" className="h-8 px-3 text-sm"> {/* Increased button size */}
              Large
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}