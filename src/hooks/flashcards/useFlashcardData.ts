"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { CardData } from "./types";
import { useCurrentRoom } from "../use-current-room"; // Import useCurrentRoom

const LOCAL_STORAGE_KEY = 'guest_flashcards';

export function useFlashcardData() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom(); // Get current room ID
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    if (session && supabase) {
      setIsLoggedInMode(true);
      
      let fetchedCards: CardData[] = [];
      if (currentRoomId) {
        // Fetch cards for the current room
        const { data: roomCards, error: fetchError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('room_id', currentRoomId)
          .order('created_at', { ascending: true });

        if (fetchError) {
          toast.error("Error fetching flashcards for room: " + fetchError.message);
          console.error("Error fetching flashcards (Supabase, room):", fetchError);
        } else {
          fetchedCards = roomCards as CardData[];
        }
      } else {
        // Fetch personal cards (room_id is NULL)
        const { data: personalCards, error: fetchError } = await supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', session.user.id)
          .is('room_id', null)
          .order('created_at', { ascending: true });

        if (fetchError) {
          toast.error("Error fetching personal flashcards: " + fetchError.message);
          console.error("Error fetching flashcards (Supabase, personal):", fetchError);
        } else {
          fetchedCards = personalCards as CardData[];
        }

        // Attempt to migrate local cards to personal cards if they exist
        const localCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localCards: CardData[] = [];
        try {
          localCards = localCardsString ? JSON.parse(localCardsString) : [];
        } catch (e) {
          console.error("Error parsing local storage cards:", e);
          localCards = [];
        }

        if (localCards.length > 0) {
          console.log(`Found ${localCards.length} local cards. Attempting migration...`);
          const toInsert = localCards.filter(localCard => 
            !fetchedCards.some(sc => sc.front.toLowerCase() === localCard.front.toLowerCase() && sc.back.toLowerCase() === localCard.back.toLowerCase()) // Avoid duplicates
          ).map(localCard => ({
            user_id: session.user.id,
            room_id: null, // Migrate as personal cards
            category_id: localCard.category_id,
            front: localCard.front,
            back: localCard.back,
            starred: localCard.starred,
            status: localCard.status,
            seen_count: localCard.seen_count,
            last_reviewed_at: localCard.last_reviewed_at,
            interval_days: localCard.interval_days,
            correct_guesses: localCard.correct_guesses || 0,
            incorrect_guesses: localCard.incorrect_guesses || 0,
          }));

          if (toInsert.length > 0) {
            const { data: newSupabaseCards, error: insertError } = await supabase
              .from('flashcards')
              .insert(toInsert)
              .select();

            if (insertError) {
              console.error("Error migrating local cards to Supabase:", insertError);
              toast.error("Error migrating some local cards.");
            } else if (newSupabaseCards) {
              fetchedCards = [...fetchedCards, ...newSupabaseCards as CardData[]];
              localStorage.removeItem(LOCAL_STORAGE_KEY);
              toast.success("Local flashcards migrated to your account!");
            }
          } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear if all already exist
          }
        }
      }
      setCards(fetchedCards);
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
  }, [session, supabase, authLoading, currentRoomId]); // Depend on currentRoomId

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
    currentRoomId, // Expose currentRoomId for mutations
  };
}