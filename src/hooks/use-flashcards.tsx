"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export interface CardData {
  id: string;
  user_id?: string; // Optional for local storage cards
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learning' | 'mastered';
  seen_count: number;
  last_reviewed_at: string | null;
  interval_days: number;
  correct_guesses: number; // New field
  incorrect_guesses: number; // New field
}

const LOCAL_STORAGE_KEY = 'guest_flashcards';

export function useFlashcards() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  // This function will only handle the 'new' to 'learning' status transition and initial seen_count
  const markCardAsSeen = useCallback(async (cardId: string) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate || cardToUpdate.status !== 'new') return; // Only act on 'new' cards

    const now = new Date().toISOString();
    const newStatus: CardData['status'] = 'learning';
    const newSeenCount = 1; // Mark as seen once

    if (isLoggedInMode && session && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .update({
          seen_count: newSeenCount,
          last_reviewed_at: now,
          status: newStatus,
        })
        .eq('id', cardId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error("Error marking card as seen (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
      }
    } else {
      setCards(prevCards => {
        const updated = prevCards.map(card =>
          card.id === cardId
            ? { ...card, seen_count: newSeenCount, last_reviewed_at: now, status: newStatus }
            : card
        );
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [cards, isLoggedInMode, session, supabase]);

  // This function will increment seen_count on explicit interaction (flip/answer)
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
  }, [cards, isLoggedInMode, session, supabase]);

  // Helper to update card interaction (seen_count, last_reviewed_at, status based on feedback)
  const handleAnswerFeedback = useCallback(async (cardId: string, isCorrect: boolean) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    // Increment seen count here as well, since answering is an interaction
    await incrementCardSeenCount(cardId); // Call the new function

    const newCorrectGuesses = isCorrect ? cardToUpdate.correct_guesses + 1 : cardToUpdate.correct_guesses;
    const newIncorrectGuesses = isCorrect ? cardToUpdate.incorrect_guesses : cardToUpdate.incorrect_guesses + 1;
    const now = new Date().toISOString();
    let newStatus: CardData['status'] = cardToUpdate.status;
    let newIntervalDays = cardToUpdate.interval_days;

    if (isCorrect) {
      if (newStatus === 'new') {
        newStatus = 'learning'; // Should ideally be handled by markCardAsSeen, but as a fallback
      } else if (newStatus === 'learning') {
        newIntervalDays = Math.max(1, newIntervalDays * 2 || 1);
        if (newIntervalDays >= 7) {
          newStatus = 'mastered';
        }
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

      if (error) {
        console.error("Error updating card interaction (Supabase):", error);
      } else if (data) {
        setCards(prevCards => prevCards.map(card => card.id === cardId ? data as CardData : card));
      }
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
  }, [cards, isLoggedInMode, session, supabase, incrementCardSeenCount]); // Add incrementCardSeenCount to dependencies

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadCards = async () => {
      setLoading(true);
      if (session && supabase) {
        // User is logged in
        setIsLoggedInMode(true);
        console.log("User logged in. Checking for local cards to migrate...");

        // 1. Load local cards (if any)
        const localCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localCards: CardData[] = [];
        try {
          localCards = localCardsString ? JSON.parse(localCardsString) : [];
        } catch (e) {
          console.error("Error parsing local storage cards:", e);
          localCards = [];
        }

        // 2. Fetch user's existing cards from Supabase
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
          let mergedCards = [...(supabaseCards as CardData[])];

          // 3. Migrate local cards to Supabase if they don't already exist
          if (localCards.length > 0) {
            console.log(`Found ${localCards.length} local cards. Attempting migration...`);
            for (const localCard of localCards) {
              // Check if a similar card (by front/back) already exists in Supabase
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
                    correct_guesses: localCard.correct_guesses || 0, // Include new field
                    incorrect_guesses: localCard.incorrect_guesses || 0, // Include new field
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
            // Clear local storage after migration attempt
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            toast.success("Local flashcards migrated to your account!");
          }
          setCards(mergedCards);
        }
      } else {
        // User is a guest (not logged in)
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

  // Effect to save cards to local storage when in guest mode
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
          correct_guesses: 0, // Initialize new field
          incorrect_guesses: 0, // Initialize new field
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
        correct_guesses: 0,
        incorrect_guesses: 0,
      };
      setCards((prevCards) => [...prevCards, newCard]);
      toast.success("Flashcard added successfully (saved locally)!");
    }
  }, [isLoggedInMode, session, supabase]);

  const handleBulkAddCards = useCallback(async (newCards: { front: string; back:string }[]): Promise<number> => {
    const uniqueNewCards = newCards.filter(newCard => 
      !cards.some(existingCard => 
        existingCard.front.toLowerCase() === newCard.front.toLowerCase() && 
        existingCard.back.toLowerCase() === newCard.back.toLowerCase()
      )
    );

    if (uniqueNewCards.length === 0) {
      toast.info("No new cards to import. All provided cards already exist in the deck.");
      return 0;
    }

    if (isLoggedInMode && session && supabase) {
      const cardsToInsert = uniqueNewCards.map(card => ({
        user_id: session.user.id,
        front: card.front,
        back: card.back,
        starred: false,
        status: 'new' as const,
        seen_count: 0,
        last_reviewed_at: null,
        interval_days: 0,
        correct_guesses: 0,
        incorrect_guesses: 0,
      }));

      const { data, error } = await supabase
        .from('flashcards')
        .insert(cardsToInsert)
        .select();

      if (error) {
        toast.error("Error importing cards (Supabase): " + error.message);
        console.error("Error importing cards (Supabase):", error);
        return 0;
      } else if (data) {
        setCards((prevCards) => [...prevCards, ...data as CardData[]]);
        return data.length;
      }
    } else {
      const guestCards: CardData[] = uniqueNewCards.map(card => ({
        id: crypto.randomUUID(),
        front: card.front,
        back: card.back,
        starred: false,
        status: 'new',
        seen_count: 0,
        last_reviewed_at: null,
        interval_days: 0,
        correct_guesses: 0,
        incorrect_guesses: 0,
      }));
      setCards((prevCards) => [...prevCards, ...guestCards]);
      return guestCards.length;
    }
    return 0;
  }, [cards, isLoggedInMode, session, supabase]);

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
        .update({ seen_count: 0, status: 'new' as CardData['status'], last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0 })
        .eq('user_id', session.user.id);

      if (error) {
        toast.error("Error resetting progress (Supabase): " + error.message);
        console.error("Error resetting progress (Supabase):", error);
      } else {
        setCards(prevCards => prevCards.map(card => ({ ...card, seen_count: 0, status: 'new' as CardData['status'], last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0 })));
        toast.success("All card progress reset!");
      }
    } else {
      setCards(prevCards => {
        const updated = prevCards.map(card => ({ ...card, seen_count: 0, status: 'new' as CardData['status'], last_reviewed_at: null, interval_days: 0, correct_guesses: 0, incorrect_guesses: 0 }));
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
    handleAnswerFeedback,
    markCardAsSeen, // Expose new function
    incrementCardSeenCount, // Expose new function
    handleAddCard,
    handleBulkAddCards,
    handleDeleteCard,
    handleShuffleCards,
    handleToggleStar,
    handleMarkAsLearned,
    handleUpdateCard,
    handleReorderCards,
    handleResetProgress,
  };
}