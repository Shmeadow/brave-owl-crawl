"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { CardData } from "./types";
import { useCurrentRoom } from "@/hooks/use-current-room";

const LOCAL_STORAGE_KEY = 'guest_flashcards';

export function useFlashcardData() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      const localCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
      let localCards: CardData[] = [];
      try {
        localCards = localCardsString ? JSON.parse(localCardsString) : [];
      } catch (e) {
        console.error("Error parsing local storage cards:", e);
      }

      const query = supabase.from('flashcards').select('*');
      if (currentRoomId) {
        query.eq('room_id', currentRoomId);
      } else {
        query.is('room_id', null).eq('user_id', session.user.id);
      }
      const { data: supabaseCards, error: fetchError } = await query.order('created_at', { ascending: true });

      if (fetchError) {
        toast.error("Error fetching flashcards: " + fetchError.message);
        setCards([]);
      } else {
        let mergedCards = [...(supabaseCards as CardData[])];
        if (localCards.length > 0 && !currentRoomId) {
          for (const localCard of localCards) {
            const existsInSupabase = mergedCards.some(sc => sc.front === localCard.front && sc.back === localCard.back);
            if (!existsInSupabase) {
              const { data: newSupabaseCard, error: insertError } = await supabase
                .from('flashcards')
                .insert({
                  user_id: session.user.id,
                  room_id: null,
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
                console.error("Error migrating local card:", insertError);
              } else if (newSupabaseCard) {
                mergedCards.push(newSupabaseCard as CardData);
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
      }
      setCards(loadedCards);
      if (loadedCards.length === 0 && !currentRoomId) {
        toast.info("You are browsing flashcards as a guest. Your cards will be saved locally.");
      }
    }
    setLoading(false);
  }, [session, supabase, authLoading, currentRoomId]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

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