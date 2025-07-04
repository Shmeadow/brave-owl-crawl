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

  const incrementCardSeenCount = useCallback(async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newSeenCount = cardToUpdate.seen_count + 1;
    const now = new Date().toISOString();

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({
          seen_count: newSeenCount,
          last_reviewed_at: now,
        })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error("Error incrementing seen count (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
      }
    } else {
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId
            ? { ...card, seen_count: newSeenCount, last_reviewed_at: now }
            : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleAnswerFeedback = useCallback(async (cardId: string, isCorrect: boolean) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    await incrementCardSeenCount(cardId);

    const newCorrectGuesses = isCorrect ? cardToUpdate.correct_guesses + 1 : cardToUpdate.correct_guesses;
    const newIncorrectGuesses = isCorrect ? cardToUpdate.incorrect_guesses : cardToUpdate.incorrect_guesses + 1;
    const now = new Date().toISOString();
    let newStatus: CardData['status'] = cardToUpdate.status;
    let newIntervalDays = cardToUpdate.interval_days;

    if (isCorrect) {
      if (newStatus === 'new') newStatus = 'learning';
      else if (newStatus === 'learning') {
        newIntervalDays = Math.max(1, newIntervalDays * 2 || 1);
        if (newIntervalDays >= 7) newStatus = 'mastered';
      }
    } else {
      newStatus = 'new';
      newIntervalDays = 0;
    }

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({
          last_reviewed_at: now,
          status: newStatus,
          interval_days: newIntervalDays,
          correct_guesses: newCorrectGuesses,
          incorrect_guesses: newIncorrectGuesses,
        })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) console.error("Error updating card interaction (Supabase):", error);
      else if (data) setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
    } else {
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId
            ? { ...card, last_reviewed_at: now, status: newStatus, interval_days: newIntervalDays, correct_guesses: newCorrectGuesses, incorrect_guesses: newIncorrectGuesses }
            : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [cards, isLoggedInMode, session, supabase, incrementCardSeenCount, setCards]);

  const markCardAsSeen = useCallback(async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate || cardToUpdate.status !== 'new') return;

    const now = new Date().toISOString();
    const newStatus: CardData['status'] = 'learning';
    const newSeenCount = 1;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({ seen_count: newSeenCount, last_reviewed_at: now, status: newStatus })
        .eq('id', cardId).eq('user_id', session.user.id).select().single();
      if (error) console.error("Error marking card as seen (Supabase):", error);
      else if (data) setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
    } else {
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId ? { ...card, seen_count: newSeenCount, last_reviewed_at: now, status: newStatus } : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleAddCard = useCallback(async (newCardData: { front: string; back: string }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('flashcards').insert({
        user_id: session.user.id, front: newCardData.front, back: newCardData.back,
        starred: false, status: 'new', seen_count: 0, last_reviewed_at: null, interval_days: 0,
        correct_guesses: 0, incorrect_guesses: 0,
      }).select().single();
      if (error) toast.error("Error adding flashcard (Supabase): " + error.message);
      else if (data) {
        setCards(prev => [...prev, data as CardData]);
        toast.success("Flashcard added to your account!");
      }
    } else {
      const newCard: CardData = {
        id: crypto.randomUUID(), front: newCardData.front, back: newCardData.back,
        starred: false, status: 'new', seen_count: 0, last_reviewed_at: null, interval_days: 0,
        correct_guesses: 0, incorrect_guesses: 0,
      };
      setCards(prev => [...prev, newCard]);
      toast.success("Flashcard added (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase, setCards]);

  const handleBulkAddCards = useCallback(async (newCards: { front: string; back:string }[]): Promise<number> => {
    const uniqueNewCards = newCards.filter(nc => !cards.some(ec => ec.front.toLowerCase() === nc.front.toLowerCase() && ec.back.toLowerCase() === nc.back.toLowerCase()));
    if (uniqueNewCards.length === 0) {
      toast.info("No new cards to import.");
      return 0;
    }
    if (isLoggedInMode && session && supabase) {
      const toInsert = uniqueNewCards.map(c => ({
        user_id: session.user.id, front: c.front, back: c.back, starred: false, status: 'new' as const,
        seen_count: 0, last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0,
      }));
      const { data, error } = await supabase.from('flashcards').insert(toInsert).select();
      if (error) {
        toast.error("Error importing cards (Supabase): " + error.message);
        return 0;
      } else if (data) {
        setCards(prev => [...prev, ...data as CardData[]]);
        return data.length;
      }
    } else {
      const guestCards: CardData[] = uniqueNewCards.map(c => ({
        id: crypto.randomUUID(), front: c.front, back: c.back, starred: false, status: 'new',
        seen_count: 0, last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0,
      }));
      setCards(prev => [...prev, ...guestCards]);
      return guestCards.length;
    }
    return 0;
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('flashcards').delete().eq('id', cardId).eq('user_id', session.user.id);
      if (error) toast.error("Error deleting flashcard (Supabase): " + error.message);
      else {
        setCards(prev => prev.filter(c => c.id !== cardId));
        toast.success("Flashcard deleted from your account.");
      }
    } else {
      setCards(prev => prev.filter(c => c.id !== cardId));
      toast.success("Flashcard deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase, setCards]);

  const handleUpdateCard = useCallback(async (cardId: string, updatedData: { front: string; back: string }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('flashcards').update(updatedData).eq('id', cardId).eq('user_id', session.user.id).select().single();
      if (error) toast.error("Error updating flashcard (Supabase): " + error.message);
      else if (data) {
        setCards(prev => prev.map(c => c.id === cardId ? data as CardData : c));
        toast.success("Flashcard updated!");
      }
    } else {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, ...updatedData } : c));
      toast.success("Flashcard updated (locally)!");
    }
  }, [isLoggedInMode, session, supabase, setCards]);

  const handleToggleStar = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const newStarred = !card.starred;
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('flashcards').update({ starred: newStarred }).eq('id', cardId).eq('user_id', session.user.id).select().single();
      if (error) toast.error("Error updating star status (Supabase): " + error.message);
      else if (data) {
        setCards(prev => prev.map(c => c.id === cardId ? data as CardData : c));
        toast.info(newStarred ? "Card starred!" : "Card unstarred.");
      }
    } else {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, starred: newStarred } : c));
      toast.info(newStarred ? "Card starred (locally)!" : "Card unstarred (locally).");
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleMarkAsLearned = useCallback(async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    const newStatus = card.status === 'mastered' ? 'new' : 'mastered';
    const newInterval = newStatus === 'mastered' ? 7 : 0;
    const now = new Date().toISOString();
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase.from('flashcards').update({ status: newStatus, last_reviewed_at: now, interval_days: newInterval }).eq('id', cardId).eq('user_id', session.user.id).select().single();
      if (error) toast.error("Error updating card status (Supabase): " + error.message);
      else if (data) {
        setCards(prev => prev.map(c => c.id === cardId ? data as CardData : c));
        toast.info(newStatus === 'mastered' ? "Card marked as learned!" : "Card marked as new.");
      }
    } else {
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, status: newStatus, last_reviewed_at: now, interval_days: newInterval } : c));
      toast.info(newStatus === 'mastered' ? "Card marked as learned (locally)!" : "Card marked as new (locally).");
    }
  }, [cards, isLoggedInMode, session, supabase, setCards]);

  const handleResetProgress = useCallback(async () => {
    const resetData = { seen_count: 0, status: 'new' as CardData['status'], last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0 };
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase.from('flashcards').update(resetData).eq('user_id', session.user.id);
      if (error) toast.error("Error resetting progress (Supabase): " + error.message);
      else {
        setCards(prev => prev.map(c => ({ ...c, ...resetData })));
        toast.success("All card progress reset!");
      }
    } else {
      setCards(prev => {
        const updated = prev.map(c => ({ ...c, ...resetData }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      toast.success("All card progress reset (locally)!");
    }
  }, [isLoggedInMode, session, supabase, setCards]);

  return {
    handleAddCard,
    handleBulkAddCards,
    handleDeleteCard,
    handleUpdateCard,
    handleToggleStar,
    handleMarkAsLearned,
    handleResetProgress,
    handleAnswerFeedback,
    markCardAsSeen,
    incrementCardSeenCount,
  };
}