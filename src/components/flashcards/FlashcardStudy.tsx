"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RefreshCcw } from 'lucide-react';
import { CardData } from '@/hooks/use-flashcards';
import { FlashCard } from '@/components/flash-card';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FlashcardStudyProps {
  flashcards: CardData[];
  markCardAsSeen: (cardId: string) => void; // New prop
  incrementCardSeenCount: (cardId: string) => void; // New prop
}

export function FlashcardStudy({ flashcards, markCardAsSeen, incrementCardSeenCount }: FlashcardStudyProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    // Reset state when flashcards change (e.g., new set loaded)
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [flashcards]);

  // When currentCard changes, mark it as seen (if 'new')
  useEffect(() => {
    if (flashcards.length > 0 && flashcards[currentIndex]) {
      markCardAsSeen(flashcards[currentIndex].id);
    }
  }, [currentIndex, flashcards, markCardAsSeen]);

  if (flashcards.length === 0) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">No flashcards to study!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Go to "Manage Flashcards" to add some.</p>
        </CardContent>
      </Card>
    );
  }

  const currentCard = flashcards[currentIndex];

  // Safeguard: Ensure currentCard is defined before rendering its properties
  if (!currentCard) {
    return (
      <Card className="text-center p-8 bg-card backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold mb-4">Generating card...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
    // Increment seen count only when the card is explicitly flipped
    incrementCardSeenCount(currentCard.id);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <Card className="flex flex-col items-center space-y-6 bg-card backdrop-blur-xl border-white/20 p-8 rounded-xl shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-foreground">Study Mode</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 w-full">
        <FlashCard
          front={currentCard.front}
          back={currentCard.back}
          isFlipped={isFlipped}
          onClick={handleFlip} // This will now also increment seen count
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

        <div className="text-md text-muted-foreground mt-4 text-center">
          <p>Status: <span className="capitalize">{currentCard.status}</span></p>
          <p>Seen: {currentCard.seen_count} times</p>
        </div>
      </CardContent>
    </Card>
  );
}