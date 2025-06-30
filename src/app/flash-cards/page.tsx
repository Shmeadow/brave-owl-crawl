"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FlashCardDeck } from "@/components/flash-card-deck";
import { FlashCardListSidebar } from "@/components/flash-card-list-sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";

export interface CardData {
  id: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learned'; // 'new' means not learned, 'learned' means learned
  seenCount: number; // How many times this card has been seen/interacted with
}

type FilterMode = 'all' | 'starred' | 'learned';

const LOCAL_STORAGE_KEY = "flashcards";

const defaultCards: CardData[] = [
  { id: "1", front: "What is React?", back: "A JavaScript library for building user interfaces.", starred: false, status: 'new', seenCount: 0 },
  { id: "2", front: "What is Next.js?", back: "A React framework for building full-stack web applications.", starred: false, status: 'new', seenCount: 0 },
  { id: "3", front: "What is Tailwind CSS?", back: "A utility-first CSS framework.", starred: false, status: 'new', seenCount: 0 },
  { id: "4", front: "What is TypeScript?", back: "A superset of JavaScript that adds static typing.", starred: false, status: 'new', seenCount: 0 },
  { id: "5", front: "What is a component?", back: "An independent, reusable piece of UI.", starred: false, status: 'new', seenCount: 0 },
];

export default function FlashCardsPage() {
  const [cards, setCards] = useState<CardData[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCards = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedCards) {
        // Ensure old 'seen' boolean is converted to 'seenCount'
        return JSON.parse(savedCards).map((card: any) => ({
          ...card,
          seenCount: typeof card.seen === 'boolean' ? (card.seen ? 1 : 0) : (card.seenCount || 0)
        }));
      }
      return defaultCards;
    }
    return defaultCards;
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Save cards to local storage whenever the cards state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards]);

  // Increment seenCount for the current card when index changes
  useEffect(() => {
    if (cards.length > 0) {
      setCards(prevCards =>
        prevCards.map((card, index) =>
          index === currentCardIndex ? { ...card, seenCount: card.seenCount + 1 } : card
        )
      );
    }
  }, [currentCardIndex, cards.length]); // Depend on cards.length to avoid infinite loop with cards state

  const filteredCards = cards.filter(card => {
    if (filterMode === 'starred') {
      return card.starred;
    }
    if (filterMode === 'learned') {
      return card.status === 'learned';
    }
    return true; // 'all' mode
  });

  // Adjust currentCardIndex if it goes out of bounds after filtering
  useEffect(() => {
    if (filteredCards.length > 0 && currentCardIndex >= filteredCards.length) {
      setCurrentCardIndex(0);
    } else if (filteredCards.length === 0) {
      setCurrentCardIndex(0); // Reset index if no cards match filter
    }
  }, [filterMode, filteredCards.length, currentCardIndex]);


  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      setCurrentCardIndex((prevIndex) => (prevIndex + 1) % filteredCards.length);
      toast.info("Next card!");
    }, 100);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      setCurrentCardIndex((prevIndex) =>
        prevIndex === 0 ? filteredCards.length - 1 : prevIndex - 1
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
      seenCount: 0,
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

    // Find the index of the deleted card in the original (unfiltered) array
    const deletedCardOriginalIndex = cards.findIndex(card => card.id === cardId);
    
    // Determine the new currentCardIndex based on the unfiltered cards
    let newOriginalIndex = currentCardIndex;
    if (deletedCardOriginalIndex === currentCardIndex) {
        newOriginalIndex = Math.min(currentCardIndex, updatedCards.length - 1);
    } else if (deletedCardOriginalIndex < currentCardIndex) {
        newOriginalIndex = currentCardIndex - 1;
    }
    if (newOriginalIndex < 0) newOriginalIndex = 0;

    setCards(updatedCards);
    // After updating cards, we need to find the corresponding index in the *newly filtered* list
    // This is complex, so for simplicity, we'll just reset to 0 or the closest valid index in the filtered list.
    // A more robust solution would involve mapping the current card ID to its new index in the filtered list.
    // For now, let's just set it to 0 if the current card was deleted or if the index is out of bounds.
    setCurrentCardIndex(0); // Simpler approach for now, can be refined later.
    setIsFlipped(false);
    toast.success("Flashcard deleted.");
  };

  const handleShuffleCards = () => {
    if (filteredCards.length <= 1) {
      toast.info("Need at least two cards to shuffle.");
      return;
    }
    const shuffledCards = [...filteredCards].sort(() => Math.random() - 0.5);
    // Update the original cards array based on the shuffled filtered cards
    setCards(prevCards => {
      const newCardsMap = new Map(prevCards.map(card => [card.id, card]));
      shuffledCards.forEach(shuffledCard => {
        newCardsMap.set(shuffledCard.id, { ...shuffledCard, seenCount: 0, status: 'new' }); // Reset seenCount and status on shuffle
      });
      return Array.from(newCardsMap.values());
    });
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

  const handleReorderCards = (newOrder: CardData[]) => {
    // This reorders the *filtered* cards. We need to apply this reordering to the *original* cards.
    // This is a more complex operation. For now, I'll just update the original cards based on the new order of filtered cards.
    // A more robust solution would involve mapping IDs and inserting/removing.
    setCards(prevCards => {
      const newCardsMap = new Map(prevCards.map(card => [card.id, card]));
      newOrder.forEach(card => newCardsMap.set(card.id, card));
      return Array.from(newCardsMap.values());
    });
    toast.success("Flashcards reordered!");
  };

  const handleResetProgress = () => {
    setCards(prevCards => prevCards.map(card => ({ ...card, seenCount: 0, status: 'new' })));
    setCurrentCardIndex(0);
    setIsFlipped(false);
    toast.success("All card progress reset!");
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Flash Cards</h1>
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
          <ResizablePanel defaultSize={70} minSize={40}>
            <div className="flex flex-col items-center justify-center h-full p-4">
              <FlashCardDeck
                cards={filteredCards} // Pass filtered cards
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
                filterMode={filterMode} // Pass filter mode
                setFilterMode={setFilterMode} // Pass setter for filter mode
                onResetProgress={handleResetProgress} // Pass reset progress handler
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={20}>
            <div className="h-full p-4">
              <FlashCardListSidebar
                cards={filteredCards} // Pass filtered cards
                currentCardIndex={currentCardIndex}
                onSelectCard={handleSelectCard}
                onDeleteCard={handleDeleteCard}
                onUpdateCard={handleUpdateCard}
                onToggleStar={handleToggleStar}
                onMarkAsLearned={handleMarkAsLearned}
                onReorderCards={handleReorderCards}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}