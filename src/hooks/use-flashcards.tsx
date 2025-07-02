"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface CardData {
  id: string;
  user_id?: string;
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learning' | 'mastered';
  seen_count: number;
  last_reviewed_at: string | null;
  interval_days: number;
}

const LOCAL_STORAGE_KEY = 'guest_flashcards';

export function useFlashcards() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const updateCardInteraction = useCallback(async (cardId: string) => {
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
        console.error("Error updating card interaction (Supabase):", error);
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
  }, [cards, isLoggedInMode, session, supabase]);

  useEffect(() => {
    if (authLoading) return;

    const loadCards = async () => {
      setLoading(true);
      if (session && supabase) {
        setIsLoggedInMode(true);
        console.log("User logged in. Checking for local cards to migrate...");

        const localCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localCards: CardData[] = [];
        try {
          localCards = localCardsString ? JSON.parse(localCardsString) : [];
        } catch (e) {
          console.error("Error parsing local storage cards:", e);
          localCards = [];
        }

        const { data: supabaseCards, error: fetchError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true });

        if (fetchError) {
          toast.error("Error fetching flashcards from Supabase: " + fetchError.message);
          console.error("Error fetching flashcards (Supabase):", fetchError);
          setCards([]);
        } else {
          const mergedCards = [...(supabaseCards as CardData[])]; // Changed to const

          if (localCards.length > 0) {
            console.log(`Found ${localCards.length} local cards. Attempting migration...`);
            for (const localCard of localCards) {
              const existsInSupabase = mergedCards.some(
                sc => sc.front === localCard.front && sc.back === localCard.back
              );

              if (!existsInSupabase) {
                const { data: newSupabaseCard, error: insertError } = await supabase
                  .from('flashcards')
                  .insert({
                    user_id: session.user.id,
                    front: localCard.front,
                    back: localCard.back,
                    starred: localCard.starred,
                    status: localCard.status,
                    seen_count: localCard.seen_count,
                    last_reviewed_at: localCard.last_reviewed_at,
                    interval_days: localCard.interval_days,
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error migrating local card to Supabase:", insertError);
                  toast.error("Error migrating some local cards.");
                } else if (newSupabaseCard) {
                  mergedCards.push(newSupabaseCard as CardData);
                  console.log("Migrated local card:", newSupabaseCard.front);
                }
              }
            }
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            toast.success("Local flashcards migrated to your account!");
          }
          setCards(mergedCards);
        }
      } else {
        setIsLoggedInMode(false);
        const storedCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let loadedCards: CardData[] = [];
        try {
          loadedCards = storedCardsString ? JSON.parse(storedCardsString) : [];
        } catch (e) {
          console.error("Error parsing local storage cards:", e);
          loadedCards = [];
        }
        setCards(loadedCards);
        if (loadedCards.length === 0) {
          toast.info("You are browsing flashcards as a guest. Your cards will be saved locally.");
        }
      }
      setLoading(false);
    };

    loadCards();
  }, [session, supabase, authLoading]);

  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards, isLoggedInMode, loading]);

  const handleAddCard = useCallback(async (newCardData: { front: string; back: string }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          user_id: session.user.id,
          front: newCardData.front,
          back: newCardData.back,
          starred: false,
          status: 'new',
          seen_count: 0,
          last_reviewed_at: null,
          interval_days: 0,
        })
        .select()
        .single();

      if (error) {
        toast.error("Error adding flashcard (Supabase): " + error.message);
        console.error("Error adding flashcard (Supabase):", error);
      } else if (data) {
        setCards((prevCards) => [...prevCards, data as CardData]);
        toast.success("Flashcard added successfully to your account!");
      }
    } else {
      const newCard: CardData = {
        id: crypto.randomUUID(),
        front: newCardData.front,
        back: newCardData.back,
        starred: false,
        status: 'new',
        seen_count: 0,
        last_reviewed_at: null,
        interval_days: 0,
      };
      setCards((prevCards) => [...prevCards, newCard]);
      toast.success("Flashcard added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error deleting flashcard (Supabase): " + error.message);
        console.error("Error deleting flashcard (Supabase):", error);
      } else {
        setCards(prevCards => prevCards.filter(card => card.id !== cardId));
        toast.success("Flashcard deleted from your account.");
      }
    } else {
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      toast.success("Flashcard deleted (locally).");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleShuffleCards = useCallback(() => {
    if (cards.length <= 1) {
      toast.info("Need at least two cards to shuffle.");
      return;
    }
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    toast.success("Flashcards shuffled!");
  }, [cards]);

  const handleToggleStar = useCallback(async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newStarredStatus = !cardToUpdate.starred;

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({ starred: newStarredStatus })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating star status (Supabase): " + error.message);
        console.error("Error updating star status (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
        toast.info(newStarredStatus ? "Card starred for later!" : "Card unstarred.");
      }
    } else {
      setCards(prevCards => prevCards.map(card =>
        card.id === cardId ? { ...card, starred: newStarredStatus } : card
      ));
      toast.info(newStarredStatus ? "Card starred for later (locally)!" : "Card unstarred (locally).");
    }
  }, [cards, isLoggedInMode, session, supabase]);

  const handleMarkAsLearned = useCallback(async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const newStatus = cardToUpdate.status === 'mastered' ? 'new' : 'mastered';
    const newInterval = newStatus === 'mastered' ? 7 : 0;
    const now = new Date().toISOString();

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({
          status: newStatus,
          last_reviewed_at: now,
          interval_days: newInterval,
        })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating card status (Supabase): " + error.message);
        console.error("Error updating card status (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
        toast.info(newStatus === 'mastered' ? "Card marked as learned!" : "Card marked as new.");
      }
    } else {
      setCards(prevCards => prevCards.map(card =>
        card.id === cardId
          ? { ...card, status: newStatus, last_reviewed_at: now, interval_days: newInterval }
          : card
      ));
      toast.info(newStatus === 'mastered' ? "Card marked as learned (locally)!" : "Card marked as new (locally).");
    }
  }, [cards, isLoggedInMode, session, supabase]);

  const handleUpdateCard = useCallback(async (cardId: string, updatedData: { front: string; back: string }) => {
    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update(updatedData)
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        toast.error("Error updating flashcard (Supabase): " + error.message);
        console.error("Error updating flashcard (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
        toast.success("Flashcard updated successfully!");
      }
    } else {
      setCards(prevCards => prevCards.map(card =>
        card.id === cardId ? { ...card, ...updatedData } : card
      ));
      toast.success("Flashcard updated successfully (locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleReorderCards = useCallback(async (newOrder: CardData[]) => {
    setCards(newOrder);
    if (!isLoggedInMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newOrder));
    }
    toast.success("Flashcards reordered locally!");
  }, [isLoggedInMode]);

  const handleResetProgress = useCallback(async () => {
    if (isLoggedInMode && session && supabase) {
      const { error } = await supabase
        .from('flashcards')
        .update({ seen_count: 0, status: 'new' as CardData['status'], last_reviewed_at: null, interval_days: 0 })
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error resetting progress (Supabase): " + error.message);
        console.error("Error resetting progress (Supabase):", error);
      } else {
        setCards(prevCards => prevCards.map(card => ({ ...card, seen_count: 0, status: 'new' as CardData['status'], last_reviewed_at: null, interval_days: 0 })));
        toast.success("All card progress reset!");
      }
    } else {
      setCards(prevCards => {
        const updated = prevCards.map(card => ({ ...card, seen_count: 0, status: 'new' as CardData['status'], last_reviewed_at: null, interval_days: 0 }));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
      toast.success("All card progress reset (locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  return {
    cards,
    loading,
    isLoggedInMode,
    updateCardInteraction,
    handleAddCard,
    handleDeleteCard,
    handleShuffleCards,
    handleToggleStar,
    handleMarkAsLearned,
    handleUpdateCard,
    handleReorderCards,
    handleResetProgress,
  };
}