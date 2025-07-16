"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CardData } from "./use-flashcards"; // Import CardData from the new hook

interface UseFlashcardNavigationProps {
  filteredCards: CardData[];
  updateCardInteraction: (cardId: string) => void;
}

export function useFlashcardNavigation({ filteredCards, updateCardInteraction }: UseFlashcardNavigationProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Adjust currentCardIndex if it goes out of bounds after filtering
  useEffect(() => {
    setCurrentCardIndex(currentIndex => {
      if (filteredCards.length > 0) {
        if (currentIndex >= filteredCards.length) {
          return 0; // Reset to 0 if out of bounds
        }
        return currentIndex; // No change needed
      }
      return 0; // Reset to 0 if no cards
    });
    setIsFlipped(false); // Always unflip when filter or card set changes
  }, [filteredCards.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
    if (filteredCards.length > 0) {
      updateCardInteraction(filteredCards[currentCardIndex].id);
    }
  }, [isFlipped, filteredCards, currentCardIndex, updateCardInteraction]);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      const nextIndex = (currentCardIndex + 1) % filteredCards.length;
      setCurrentCardIndex(nextIndex);
      updateCardInteraction(filteredCards[nextIndex].id); // Update for the *new* current card
      toast.info("Next card!");
    }, 100);
  }, [currentCardIndex, filteredCards, updateCardInteraction]);

  const handlePrevious = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      const prevIndex = currentCardIndex === 0 ? filteredCards.length - 1 : currentCardIndex - 1;
      setCurrentCardIndex(prevIndex);
      updateCardInteraction(filteredCards[prevIndex].id); // Update for the *new* current card
      toast.info("Previous card!");
    }, 100);
  }, [currentCardIndex, filteredCards, updateCardInteraction]);

  const handleSelectCard = useCallback((index: number) => {
    setCurrentCardIndex(index);
    setIsFlipped(false);
  }, []);

  return {
    currentCardIndex,
    isFlipped,
    handleFlip,
    handleNext,
    handlePrevious,
    handleSelectCard,
    setCurrentCardIndex, // Expose if needed for external resets
    setIsFlipped, // Expose if needed for external resets
  };
}