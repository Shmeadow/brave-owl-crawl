"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { FlashCardDeck } from "@/components/flash-card-deck";
import { FlashCardListSidebar } from "@/components/flash-card-list-sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useFlashcards, CardData } from "@/hooks/use-flashcards"; // Import CardData and useFlashcards
import { useFlashcardNavigation } from "@/hooks/use-flashcard-navigation"; // Import useFlashcardNavigation

type FilterMode = 'all' | 'starred' | 'learned';

export default function FlashCardsPage() {
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

  // Filter cards based on the selected mode
  const filteredCards = cards.filter(card => {
    if (filterMode === 'starred') {
      return card.starred;
    }
    if (filterMode === 'learned') {
      return card.status === 'mastered';
    }
    // For 'all' mode, also consider next_review_at for spaced repetition
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
    setCurrentCardIndex, // Expose if needed for external resets
    setIsFlipped, // Expose if needed for external resets
  } = useFlashcardNavigation({ filteredCards, updateCardInteraction });

  // Reset navigation state when progress is reset
  const resetAllProgressAndNavigation = async () => {
    await handleResetProgress();
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  if (flashcardsLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full py-8">
          <p>Loading flashcards...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col flex-1 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Flash Cards</h1>
        <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
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
                onResetProgress={resetAllProgressAndNavigation} // Use the combined reset handler
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
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
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DashboardLayout>
  );
}