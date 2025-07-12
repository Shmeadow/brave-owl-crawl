"use client";

import { useFlashcardData } from './flashcards/useFlashcardData';
import { useFlashcardMutations } from './flashcards/useFlashcardMutations';
import { useFlashcardDeck } from './flashcards/useFlashcardDeck';
import { useCurrentRoom } from './use-current-room';

export type { CardData } from './flashcards/types';

export function useFlashcards() {
  const { currentRoomId } = useCurrentRoom();
  const { cards, setCards, loading, isLoggedInMode, session, supabase, fetchCards } = useFlashcardData(currentRoomId);
  
  const mutations = useFlashcardMutations({
    cards,
    setCards,
    isLoggedInMode,
    session,
    supabase,
    currentRoomId,
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