"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/components/flash-card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AddFlashCardForm } from "@/components/add-flash-card-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CardData {
  front: string;
  back: string;
}

const defaultCards: CardData[] = [
  { front: "What is React?", back: "A JavaScript library for building user interfaces." },
  { front: "What is Next.js?", back: "A React framework for building full-stack web applications." },
  { front: "What is Tailwind CSS?", back: "A utility-first CSS framework." },
  { front: "What is TypeScript?", back: "A superset of JavaScript that adds static typing." },
  { front: "What is a component?", back: "An independent, reusable piece of UI." },
];

export function FlashCardDeck() {
  const [cards, setCards] = useState<CardData[]>(defaultCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false); // Flip back to front before changing card
    setTimeout(() => {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % cards.length);
      toast.info("Next card!");
    }, 100); // Small delay to allow flip animation
  };

  const handlePrevious = () => {
    setIsFlipped(false); // Flip back to front before changing card
    setTimeout(() => {
      setCurrentCardIndex((prevIndex) =>
        prevIndex === 0 ? cards.length - 1 : prevIndex - 1
      );
      toast.info("Previous card!");
    }, 100); // Small delay to allow flip animation
  };

  const handleAddCard = (newCard: CardData) => {
    setCards((prevCards) => [...prevCards, newCard]);
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      {cards.length > 0 ? (
        <>
          <FlashCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onClick={handleFlip}
          />
          <div className="flex gap-4">
            <Button onClick={handlePrevious} variant="outline" disabled={cards.length <= 1}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={handleNext} disabled={cards.length <= 1}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Card {currentCardIndex + 1} of {cards.length}
          </p>
        </>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>No Flashcards Yet!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Add your first flashcard below.</p>
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Add New Flashcard</CardTitle>
        </CardHeader>
        <CardContent>
          <AddFlashCardForm onAddCard={handleAddCard} />
        </CardContent>
      </Card>
    </div>
  );
}