"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { CardData } from "./types";

const LOCAL_STORAGE_KEY = 'guest_flashcards';

export function useFlashcardData() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchCards = useCallback(async () => {
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
                  correct_guesses: localCard.correct_guesses || 0,
                  incorrect_guesses: localCard.incorrect_guesses || 0,
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
  }, [session, supabase, authLoading]);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;
    fetchCards();
  }, [authLoading, fetchCards]);

  // Effect to save cards to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode && !loading) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards, isLoggedInMode, loading]);

  return {
    cards,
    setCards,
    loading,
    isLoggedInMode,
    session,
    supabase,
    fetchCards,
  };
}