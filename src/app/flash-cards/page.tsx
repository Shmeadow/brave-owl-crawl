"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FlashCardDeck } from "@/components/flash-card-deck";
import { FlashCardListSidebar } from "@/components/flash-card-list-sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";

interface CardData {
  id: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learned';
  seen: boolean;
}

const LOCAL_STORAGE_KEY = "flashcards";

const defaultCards: CardData[] = [
  { id: "1", front: "What is React?", back: "A JavaScript library for building user interfaces.", starred: false, status: 'new', seen: false },
  { id: "2", front: "What is Next.js?", back: "A React framework for building full-stack web applications.", starred: false, status: 'new', seen: false },
  { id: "3", front: "What is Tailwind CSS?", back: "A utility-first CSS framework.", starred: false, status: 'new', seen: false },
  { id: "4", front: "What is TypeScript?", back: "A superset of JavaScript that adds static typing.", starred: false, status: 'new', seen: false },
  { id: "5", front: "What is a component?", back: "An independent, reusable piece of UI.", starred: false, status: 'new', seen: false },
];

export default function FlashCardsPage() {
  const [cards, setCards] = useState<CardData[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCards = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedCards ? JSON.parse(savedCards) : defaultCards;
    }
    return defaultCards;
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Save cards to local storage whenever the cards state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards]);

  // Mark current card as seen when index changes
  useEffect(() => {
    if (cards.length > 0 && !cards[currentCardIndex]?.seen) {
      setCards(prevCards =>
        prevCards.map((card, index) =>
          index === currentCardIndex ? { ...card, seen: true } : card
        )
      );
    }
  }, [currentCardIndex, cards]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (cards.length === 0) return;

      let nextIndex = -1;
      // Try to find the next 'new' card starting from the next position
      for (let i = 1; i <= cards.length; i++) {
        const potentialNextIndex = (currentCardIndex + i) % cards.length;
        if (cards[potentialNextIndex].status === 'new') {
          nextIndex = potentialNextIndex;
          break;
        }
      }

      if (nextIndex !== -1) {
        setCurrentCardIndex(nextIndex);
        toast.info("Next unlearned card!");
      } else {
        // If all cards are 'learned', just cycle through them
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % cards.length);
        toast.info("Cycling through learned cards!");
      }
    }, 100);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (cards.length === 0) return;
      setCurrentCardIndex((prevIndex) =>
        prevIndex === 0 ? cards.length - 1 : prevIndex - 1
      );
      toast.info("Previous card!");
    }, 100);
  };

  const handleAddCard = (newCardData: { front: string; back: string }) => {
    const newCard: CardData = {
      id: Date.now().toString(),
      ...newCardData,
      starred: false,
      status: 'new',
      seen: false,
    };
    setCards((prevCards) => [...prevCards, newCard]);
    toast.success("Flashcard added successfully!");
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = cards.filter(card => card.id !== cardId);

    if (updatedCards.length === 0) {
      setCards([]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      toast.success("Last flashcard deleted. Deck is now empty.");
      return;
    }

    let newIndex = currentCardIndex;
    const deletedCardIndex = cards.findIndex(card => card.id === cardId);
    if (deletedCardIndex === currentCardIndex) {
        newIndex = Math.min(currentCardIndex, updatedCards.length - 1);
    } else if (deletedCardIndex < currentCardIndex) {
        newIndex = currentCardIndex - 1;
    }
    if (newIndex < 0) newIndex = 0;

    setCards(updatedCards);
    setCurrentCardIndex(newIndex);
    setIsFlipped(false);
    toast.success("Flashcard deleted.");
  };

  const handleShuffleCards = () => {
    if (cards.length <= 1) {
      toast.info("Need at least two cards to shuffle.");
      return;
    }
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards.map(card => ({ ...card, seen: false, status: 'new' })));
    setCurrentCardIndex(0);
    setIsFlipped(false);
    toast.success("Flashcards shuffled!");
  };

  const handleToggleStar = (cardId: string) => {
    setCards((prevCards) => {
      const updated = prevCards.map((card) =>
        card.id === cardId ? { ...card, starred: !card.starred } : card
      );
      const toggledCard = updated.find(card => card.id === cardId);
      if (toggledCard) {
          toast.info(toggledCard.starred ? "Card unstarred." : "Card starred for later!");
      }
      return updated;
    });
  };

  const handleMarkAsLearned = (cardId: string) => {
    setCards((prevCards) => {
      const updated = prevCards.map((card) =>
        card.id === cardId ? { ...card, status: card.status === 'learned' ? 'new' : 'learned' } : card
      );
      const toggledCard = updated.find(card => card.id === cardId);
      if (toggledCard) {
          toast.info(toggledCard.status === 'learned' ? "Card marked as new." : "Card marked as learned!");
      }
      return updated;
    });
  };

  const handleUpdateCard = (cardId: string, updatedData: { front: string; back: string }) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === cardId ? { ...card, ...updatedData } : card
      )
    );
    toast.success("Flashcard updated successfully!");
  };

  const handleSelectCard = (index: number) => {
    setCurrentCardIndex(index);
    setIsFlipped(false);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Flash Cards</h1>
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={70} minSize={40}>
            <div className="flex flex-col items-center justify-center h-full p-4">
              <FlashCardDeck
                cards={cards}
                currentCardIndex={currentCardIndex}
                isFlipped={isFlipped}
                onFlip={handleFlip}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
                onShuffleCards={handleShuffleCards}
                onToggleStar={handleToggleStar}
                onMarkAsLearned={handleMarkAsLearned}
                onUpdateCard={handleUpdateCard}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full p-4">
              <FlashCardListSidebar
                cards={cards}
                currentCardIndex={currentCardIndex}
                onSelectCard={handleSelectCard}
                onDeleteCard={handleDeleteCard}
                onUpdateCard={handleUpdateCard}
                onToggleStar={handleToggleStar}
                onMarkAsLearned={handleMarkAsLearned}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}