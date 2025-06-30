"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlashCard } from "@/components/flash-card";
import { ArrowLeft, ArrowRight, Star, Trash2, Shuffle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { AddFlashCardForm } from "@/components/add-flash-card-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardData {
  id: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learned';
}

const defaultCards: CardData[] = [
  { id: "1", front: "What is React?", back: "A JavaScript library for building user interfaces.", starred: false, status: 'new' },
  { id: "2", front: "What is Next.js?", back: "A React framework for building full-stack web applications.", starred: false, status: 'new' },
  { id: "3", front: "What is Tailwind CSS?", back: "A utility-first CSS framework.", starred: false, status: 'new' },
  { id: "4", front: "What is TypeScript?", back: "A superset of JavaScript that adds static typing.", starred: false, status: 'new' },
  { id: "5", front: "What is a component?", back: "An independent, reusable piece of UI.", starred: false, status: 'new' },
];

export function FlashCardDeck() {
  const [cards, setCards] = useState<CardData[]>(defaultCards);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentCardIndex];
  const totalCards = cards.length;
  const learnedCards = cards.filter(card => card.status === 'learned').length;
  const starredCards = cards.filter(card => card.starred).length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % totalCards);
      toast.info("Next card!");
    }, 100);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prevIndex) =>
        prevIndex === 0 ? totalCards - 1 : prevIndex - 1
      );
      toast.info("Previous card!");
    }, 100);
  };

  const handleAddCard = (newCardData: { front: string; back: string }) => {
    const newCard: CardData = {
      id: Date.now().toString(), // Simple unique ID
      ...newCardData,
      starred: false,
      status: 'new',
    };
    setCards((prevCards) => [...prevCards, newCard]);
    toast.success("Flashcard added successfully!");
  };

  const handleDeleteCard = () => {
    if (totalCards === 0) {
      toast.error("No cards to delete.");
      return;
    }

    const cardToDeleteId = currentCard.id;
    const updatedCards = cards.filter(card => card.id !== cardToDeleteId);

    if (updatedCards.length === 0) {
      setCards([]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      toast.success("Last flashcard deleted. Deck is now empty.");
      return;
    }

    // Adjust index if the deleted card was the last one in the array
    let newIndex = currentCardIndex;
    if (newIndex >= updatedCards.length) {
      newIndex = updatedCards.length - 1;
    }

    setCards(updatedCards);
    setCurrentCardIndex(newIndex);
    setIsFlipped(false);
    toast.success("Flashcard deleted.");
  };

  const handleShuffleCards = () => {
    if (totalCards <= 1) {
      toast.info("Need at least two cards to shuffle.");
      return;
    }
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setCurrentCardIndex(0); // Reset to first card after shuffle
    setIsFlipped(false);
    toast.success("Flashcards shuffled!");
  };

  const handleToggleStar = () => {
    if (totalCards === 0) return;

    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === currentCard.id ? { ...card, starred: !card.starred } : card
      )
    );
    toast.info(currentCard.starred ? "Card unstarred." : "Card starred for later!");
  };

  const handleMarkAsLearned = () => {
    if (totalCards === 0) return;

    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === currentCard.id ? { ...card, status: card.status === 'learned' ? 'new' : 'learned' } : card
      )
    );
    toast.info(currentCard.status === 'learned' ? "Card marked as new." : "Card marked as learned!");
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto">
      {totalCards > 0 ? (
        <>
          <FlashCard
            front={currentCard.front}
            back={currentCard.back}
            isFlipped={isFlipped}
            onClick={handleFlip}
          />
          <div className="flex gap-2 w-full justify-center">
            <Button onClick={handlePrevious} variant="outline" disabled={totalCards <= 1}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <Button onClick={handleNext} disabled={totalCards <= 1}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 w-full justify-center">
            <Button onClick={handleToggleStar} variant="ghost" size="icon" className={cn(currentCard.starred && "text-yellow-500")}>
              <Star className="h-5 w-5 fill-current" />
              <span className="sr-only">Toggle Star</span>
            </Button>
            <Button onClick={handleMarkAsLearned} variant="ghost" size="icon" className={cn(currentCard.status === 'learned' && "text-green-500")}>
              <CheckCircle className="h-5 w-5 fill-current" />
              <span className="sr-only">Mark as Learned</span>
            </Button>
            <Button onClick={handleShuffleCards} variant="ghost" size="icon">
              <Shuffle className="h-5 w-5" />
              <span className="sr-only">Shuffle Cards</span>
            </Button>
            <Button onClick={handleDeleteCard} variant="ghost" size="icon" className="text-red-500">
              <Trash2 className="h-5 w-5" />
              <span className="sr-only">Delete Card</span>
            </Button>
          </div>
          <div className="text-sm text-muted-foreground flex flex-col items-center">
            <p>Card {currentCardIndex + 1} of {totalCards}</p>
            <p>{learnedCards} learned, {starredCards} starred</p>
          </div>
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