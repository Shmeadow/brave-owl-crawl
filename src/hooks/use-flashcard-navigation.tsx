"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CardData } from "./use-flashcards";

interface UseFlashcardNavigationProps {
  filteredCards: CardData[];
  updateCardInteraction: (cardId: string) => void;
}

export function useFlashcardNavigation({ filteredCards, updateCardInteraction }: UseFlashcardNavigationProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (filteredCards.length > 0) {
      if (currentCardIndex >= filteredCards.length) {
        setCurrentCardIndex(0);
      }
    } else {
      setCurrentCardIndex(0);
    }
    setIsFlipped(false);
  }, [filteredCards.length, currentCardIndex]); // Added currentCardIndex to dependencies

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
      updateCardInteraction(filteredCards[nextIndex].id);
      toast.info("Next card!");
    }, 100);
  }, [currentCardIndex, filteredCards, updateCardInteraction]);

  const handlePrevious = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      if (filteredCards.length === 0) return;
      const prevIndex = currentCardIndex === 0 ? filteredCards.length - 1 : currentCardIndex - 1;
      setCurrentCardIndex(prevIndex);
      updateCardInteraction(filteredCards[prevIndex].id);
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
    setCurrentCardIndex,
    setIsFlipped,
  };
}