"use client";

import { useFlashcardData } from './flashcards/useFlashcardData';
import { useFlashcardMutations } from './flashcards/useFlashcardMutations';
import { useFlashcardDeck } from './flashcards/useFlashcardDeck';

export type { CardData } from './flashcards/types';

export function useFlashcards() {
  const { cards, setCards, loading, isLoggedInMode, session, supabase, fetchCards, currentRoomId } = useFlashcardData();
  
  const mutations = useFlashcardMutations({
    cards,
    setCards,
    isLoggedInMode,
    session,
    supabase,
    currentRoomId, // Pass currentRoomId here
  });

  const deckActions = useFlashcardDeck({
    cards,
    setCards,
    isLoggedInMode,
  });

  return {
    cards,
    loading,
    isLoggedInMode,
    fetchCards,
    ...mutations,
    ...deckActions,
  };
}