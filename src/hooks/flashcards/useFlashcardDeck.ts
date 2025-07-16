"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { CardData } from "./types";

const LOCAL_STORAGE_KEY = 'guest_flashcards';

interface UseFlashcardDeckProps {
  cards: CardData[];
  setCards: React.Dispatch<React.SetStateAction<CardData[]>>;
  isLoggedInMode: boolean;
}

export function useFlashcardDeck({ cards, setCards, isLoggedInMode }: UseFlashcardDeckProps) {
  const handleShuffleCards = useCallback(() => {
    if (cards.length <= 1) {
      // toast.info("Need at least two cards to shuffle.");
      return;
    }
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    // toast.success("Flashcards shuffled!");
  }, [cards, setCards]);

  const handleReorderCards = useCallback(async (newOrder: CardData[]) => {
    setCards(newOrder);
    if (!isLoggedInMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newOrder));
    }
    // toast.success("Flashcards reordered locally!");
  }, [isLoggedInMode, setCards]);

  return {
    handleShuffleCards,
    handleReorderCards,
  };
}