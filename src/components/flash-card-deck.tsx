"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/components/flash-card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface CardData {
  front: string;
  back: string;
}

const initialCards: CardData[] = [
  { front: "What is React?", back: "A JavaScript library for building user interfaces." },
  { front: "What is Next.js?", back: "A React framework for building full-stack web applications." },
  { front: "What is Tailwind CSS?", back: "A utility-first CSS framework." },
  { front: "What is TypeScript?", back: "A superset of JavaScript that adds static typing." },
  { front: "What is a component?", back: "An independent, reusable piece of UI." },
];

export function FlashCardDeck() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false); // Flip back to front before changing card
    setTimeout(() => {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % initialCards.length);
      toast.info("Next card!");
    }, 100); // Small delay to allow flip animation
  };

  const handlePrevious = () => {
    setIsFlipped(false); // Flip back to front before changing card
    setTimeout(() => {
      setCurrentCardIndex((prevIndex) =>
        prevIndex === 0 ? initialCards.length - 1 : prevIndex - 1
      );
      toast.info("Previous card!");
    }, 100); // Small delay to allow flip animation
  };

  const currentCard = initialCards[currentCardIndex];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      <FlashCard
        front={currentCard.front}
        back={currentCard.back}
        isFlipped={isFlipped}
        onClick={handleFlip}
      />
      <div className="flex gap-4">
        <Button onClick={handlePrevious} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={handleNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Card {currentCardIndex + 1} of {initialCards.length}
      </p>
    </div>
  );
}