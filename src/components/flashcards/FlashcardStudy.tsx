"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CardData } from '@/hooks/use-firebase-flashcards';
import { FlashCard } from '@/components/flash-card'; // Reusing existing FlashCard component

interface FlashcardStudyProps {
  flashcards: CardData[];
}

export function FlashcardStudy({ flashcards }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Reset state when flashcards change (e.g., new set loaded)
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  if (flashcards.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <p className="text-xl font-semibold mb-4">No flashcards to study!</p>
        <p>Go to "Manage Flashcards" to add some.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  // Safeguard: Ensure currentCard is defined before rendering its properties
  if (!currentCard) {
    return (
      <div className="text-center text-muted-foreground p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <p className="text-xl font-semibold mb-4">Loading card...</p>
      </div>
    );
  }

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      <FlashCard
        front={currentCard.term}
        back={currentCard.definition}
        isFlipped={isFlipped}
        onClick={handleFlip}
      />

      <div className="text-lg text-muted-foreground font-semibold">
        Card {currentIndex + 1} / {flashcards.length}
      </div>

      <div className="flex space-x-4">
        <Button onClick={handlePrevious} disabled={flashcards.length <= 1}>
          <ArrowLeft className="mr-2 h-5 w-5" />
          Prev
        </Button>
        <Button onClick={handleFlip}>
          Flip
        </Button>
        <Button onClick={handleNext} disabled={flashcards.length <= 1}>
          Next
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}