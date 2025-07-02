"use client";

import React, { useState, useEffect } from "react";
import { FlashCardDeck } from "@/components/flash-card-deck";
import { FlashCardListSidebar } from "@/components/flash-card-list-sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useFlashcards, CardData } from "@/hooks/use-flashcards";
import { useFlashcardNavigation } from "@/hooks/use-flashcard-navigation";

type FilterMode = 'all' | 'starred' | 'learned';

interface FlashCardsWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function FlashCardsWidget({ isCurrentRoomWritable }: FlashCardsWidgetProps) {
  const {
    cards,
    loading: flashcardsLoading,
    updateCardInteraction,
    handleAddCard,
    handleDeleteCard,
    handleShuffleCards,
    handleToggleStar,
    handleMarkAsLearned,
    handleUpdateCard,
    handleReorderCards,
    handleResetProgress,
  } = useFlashcards();

  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filteredCards = cards.filter(card => {
    if (filterMode === 'starred') {
      return card.starred;
    }
    if (filterMode === 'learned') {
      return card.status === 'mastered';
    }
    const now = new Date();
    const nextReview = card.last_reviewed_at ? new Date(card.last_reviewed_at) : new Date(0);
    nextReview.setDate(nextReview.getDate() + card.interval_days);
    return now >= nextReview;
  });

  const {
    currentCardIndex,
    isFlipped,
    handleFlip,
    handleNext,
    handlePrevious,
    handleSelectCard,
    setCurrentCardIndex,
    setIsFlipped,
  } = useFlashcardNavigation({ filteredCards, updateCardInteraction });

  const resetAllProgressAndNavigation = async () => {
    await handleResetProgress();
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  if (flashcardsLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading flashcards...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col flex-1 py-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">Flash Cards</h1>
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border border-border">
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="flex flex-col items-center justify-center h-full p-4">
            <FlashCardDeck
              cards={filteredCards}
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
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              onResetProgress={resetAllProgressAndNavigation}
              isCurrentRoomWritable={isCurrentRoomWritable}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle className="bg-border/50 hover:bg-primary/50 transition-colors" />
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full p-4">
            <FlashCardListSidebar
              cards={filteredCards}
              currentCardIndex={currentCardIndex}
              onSelectCard={handleSelectCard}
              onDeleteCard={handleDeleteCard}
              onUpdateCard={handleUpdateCard}
              onToggleStar={handleToggleStar}
              onMarkAsLearned={handleMarkAsLearned}
              onReorderCards={handleReorderCards}
              isCurrentRoomWritable={isCurrentRoomWritable}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}