"use client";

import { useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { CardData } from "./types";

const LOCAL_STORAGE_KEY = 'guest_flashcards';

interface UseFlashcardMutationsProps {
  cards: CardData[];
  setCards: React.Dispatch<React.SetStateAction<CardData[]>>;
  isLoggedInMode: boolean;
  session: ReturnType<typeof useSupabase>['session'];
  supabase: ReturnType<typeof useSupabase>['supabase'];
}

export function useFlashcardMutations({ cards, setCards, isLoggedInMode, session, supabase }: UseFlashcardMutationsProps) {

  const handleAnswerFeedback = useCallback(async (cardId: string, isCorrect: boolean) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newCorrectGuesses = isCorrect ? cardToUpdate.correct_guesses + 1 : cardToUpdate.correct_guesses;
    const newIncorrectGuesses = isCorrect ? cardToUpdate.incorrect_guesses : cardToUpdate.incorrect_guesses + 1;
    const totalGuesses = newCorrectGuesses + newIncorrectGuesses;
    const correctRatio = totalGuesses > 0 ? newCorrectGuesses / totalGuesses : 0;
    const now = new Date().toISOString();
    let newStatus: CardData['status'] = 'Learning';

    if (isCorrect) {
      if (totalGuesses < 3) {
        newStatus = 'Learning';
      } else if (correctRatio < 0.3) {
        newStatus = 'Beginner';
      } else if (correctRatio < 0.6) {
        newStatus = 'Intermediate';
      } else if (correctRatio < 0.9) {
        newStatus = 'Advanced';
      } else {
        newStatus = 'Mastered';
      }
    } else {
      if (cardToUpdate.status === 'Mastered') newStatus = 'Advanced';
      else if (cardToUpdate.status === 'Advanced') newStatus = 'Intermediate';
      else if (cardToUpdate.status === 'Intermediate') newStatus = 'Beginner';
      else newStatus = 'Learning';
    }

    const updatedFields = {
      last_reviewed_at: now,
      status: newStatus,
      correct_guesses: newCorrectGuesses,
      incorrect_guesses: newIncorrectGuesses,
      seen_count: cardToUpdate.seen_count + 1,
    };

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updatedFields)
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) console.error("Error updating card interaction (Supabase):", error);
      else if (data) setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
    } else {
      const updatedCards = cards.map(card =>
        card.id === cardId
          ? { ...card, ...updatedFields }
          : card
      );
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleGradeCard = useCallback(async (cardId: string, grade: 'Easy' | 'Good' | 'Hard' | 'Again') => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    let newInterval: number;
    let newEaseFactor: number = cardToUpdate.ease_factor || 2.5;

    if (grade === 'Again') {
        newInterval = 1; // Reset interval
        newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
    } else {
        // For 'Hard', 'Good', 'Easy'
        if (grade === 'Hard') {
            newEaseFactor = Math.max(1.3, newEaseFactor - 0.15);
        }
        if (grade === 'Easy') {
            newEaseFactor += 0.15;
        }
        // 'Good' does not change ease factor

        if (cardToUpdate.interval_days === 0) {
            newInterval = 1;
        } else if (cardToUpdate.interval_days === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.ceil(cardToUpdate.interval_days * newEaseFactor);
        }
    }

    const updatedFields = {
        last_reviewed_at: new Date().toISOString(),
        interval_days: newInterval,
        ease_factor: newEaseFactor,
        seen_count: (cardToUpdate.seen_count || 0) + 1,
        status: newInterval > 30 ? 'Mastered' : newInterval > 7 ? 'Advanced' : newInterval > 1 ? 'Intermediate' : 'Learning' as CardData['status'],
    };

    if (isLoggedInMode && session && supabase) {
        const { data, error } = await supabase
            .from('flashcards')
            .update(updatedFields)
            .eq('id', cardId)
            .select()
            .single();
        if (error) {
            toast.error("Error updating card grade: " + error.message);
        } else if (data) {
            setCards(prev => prev.map(c => c.id === cardId ? data as CardData : c));
        }
    } else {
        const updatedCards = cards.map(c => c.id === cardId ? { ...c, ...updatedFields } : c);
        setCards(updatedCards);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleAddCard = useCallback(async (newCardData: { front: string; back: string; category_id?: string | null }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('flashcards').insert({
        user_id: session.user.id,
        front: newCardData.front,
        back: newCardData.back,
        category_id: newCardData.category_id,
        starred: false,
        status: 'Learning',
        seen_count: 0,
        last_reviewed_at: null,
        interval_days: 0,
        correct_guesses: 0,
        incorrect_guesses: 0,
        ease_factor: 2.5,
      }).select().single();
      if (error) toast.error("Error adding flashcard (Supabase): " + error.message);
      else if (data) {
        setCards([...cards, data as CardData]);
        toast.success("Flashcard added to your account!");
      }
    } else {
      const newCard: CardData = {
        id: crypto.randomUUID(),
        front: newCardData.front,
        back: newCardData.back,
        category_id: newCardData.category_id,
        starred: false,
        status: 'Learning',
        seen_count: 0,
        last_reviewed_at: null,
        interval_days: 0,
        correct_guesses: 0,
        incorrect_guesses: 0,
        created_at: new Date().toISOString(),
        ease_factor: 2.5,
      };
      const updatedCards = [...cards, newCard];
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      toast.success("Flashcard added (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase, setCards, cards]);

  const handleUpdateCard = useCallback(async (cardId: string, updatedData: { front: string; back: string; category_id?: string | null }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('flashcards').update(updatedData).eq('id', cardId).eq('user_id', session.user.id).select().single();
      if (error) toast.error("Error updating flashcard (Supabase): " + error.message);
      else if (data) {
        setCards(cards.map(c => c.id === cardId ? data as CardData : c));
        toast.success("Flashcard updated!");
      }
    } else {
      const updatedCards = cards.map(c => c.id === cardId ? { ...c, ...updatedData } : c);
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      toast.success("Flashcard updated (locally)!");
    }
  }, [isLoggedInMode, session, supabase, setCards, cards]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('flashcards').delete().eq('id', cardId).eq('user_id', session.user.id);
      if (error) toast.error("Error deleting flashcard (Supabase): " + error.message);
      else {
        setCards(cards.filter(c => c.id !== cardId));
        toast.success("Flashcard deleted from your account.");
      }
    } else {
      const updatedCards = cards.filter(c => c.id !== cardId);
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      toast.success("Flashcard deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase, setCards, cards]);

  const handleBulkAddCards = useCallback(async (newCards: { front: string; back:string }[], categoryId: string | null): Promise<number> => {
    const uniqueNewCards = newCards.filter(nc => !cards.some(ec => ec.front.toLowerCase() === nc.front.toLowerCase() && ec.back.toLowerCase() === nc.back.toLowerCase()));
    if (uniqueNewCards.length === 0) {
      toast.info("No new cards to import.");
      return 0;
    }
    if (isLoggedInMode && session && supabase) {
      const toInsert = uniqueNewCards.map(c => ({
        user_id: session.user.id, front: c.front, back: c.back, category_id: categoryId, starred: false, status: 'Learning' as const,
        seen_count: 0, last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0, ease_factor: 2.5,
      }));
      const { data, error } = await supabase.from('flashcards').insert(toInsert).select();
      if (error) {
        toast.error("Error importing cards (Supabase): " + error.message);
        return 0;
      } else if (data) {
        setCards([...cards, ...data as CardData[]]);
        return data.length;
      }
    } else {
      const guestCards: CardData[] = uniqueNewCards.map(c => ({
        id: crypto.randomUUID(), front: c.front, back: c.back, category_id: categoryId, starred: false, status: 'Learning',
        seen_count: 0, last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0,
        created_at: new Date().toISOString(), ease_factor: 2.5,
      }));
      const updatedCards = [...cards, ...guestCards];
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      return guestCards.length;
    }
    return 0;
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleResetProgress = useCallback(async () => {
    const resetData = { seen_count: 0, status: 'Learning' as CardData['status'], last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0, ease_factor: 2.5 };
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('flashcards').update(resetData).eq('user_id', session.user.id);
      if (error) toast.error("Error resetting progress (Supabase): " + error.message);
      else {
        setCards(cards.map(c => ({ ...c, ...resetData })));
        toast.success("All card progress reset!");
      }
    } else {
      const updatedCards = cards.map(c => ({ ...c, ...resetData }));
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      toast.success("All card progress reset (locally)!");
    }
  }, [isLoggedInMode, session, supabase, setCards, cards]);

  const handleUpdateCardCategory = useCallback(async (cardId: string, newCategoryId: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({ category_id: newCategoryId })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating card category: " + error.message);
      } else if (data) {
        setCards(prev => prev.map(c => c.id === cardId ? data as CardData : c));
        toast.success("Card moved to new category!");
      }
    } else {
      const updatedCards = cards.map(c =>
        c.id === cardId ? { ...c, category_id: newCategoryId } : c
      );
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      toast.success("Card moved (locally)!");
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleBulkDelete = useCallback(async (cardIds: string[]) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('flashcards').delete().in('id', cardIds);
      if (error) {
        toast.error("Error deleting cards: " + error.message);
      } else {
        setCards(prev => prev.filter(c => !cardIds.includes(c.id)));
        toast.success(`${cardIds.length} cards deleted.`);
      }
    } else {
      const updatedCards = cards.filter(c => !cardIds.includes(c.id));
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      toast.success(`${cardIds.length} cards deleted (locally).`);
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleBulkMove = useCallback(async (cardIds: string[], newCategoryId: string | null) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('flashcards').update({ category_id: newCategoryId }).in('id', cardIds).select();
      if (error) {
        toast.error("Error moving cards: " + error.message);
      } else if (data) {
        setCards(prev => prev.map(c => {
          const updatedCard = data.find(uc => uc.id === c.id);
          return updatedCard ? updatedCard as CardData : c;
        }));
        toast.success(`${cardIds.length} cards moved.`);
      }
    } else {
      const updatedCards = cards.map(c => cardIds.includes(c.id) ? { ...c, category_id: newCategoryId } : c);
      setCards(updatedCards);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCards));
      toast.success(`${cardIds.length} cards moved (locally).`);
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  return {
    handleAddCard,
    handleUpdateCard,
    handleDeleteCard,
    handleBulkAddCards,
    handleResetProgress,
    handleAnswerFeedback,
    handleUpdateCardCategory,
    handleBulkDelete,
    handleBulkMove,
    handleGradeCard,
  };
}