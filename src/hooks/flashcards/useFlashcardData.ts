"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { CardData } from "./types";
import { useCurrentRoom } from "../use-current-room";

const LOCAL_STORAGE_KEY = 'guest_flashcards';

export function useFlashcardData(currentRoomId: string | null) {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { isCurrentRoomWritable } = useCurrentRoom();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      if (session) {
        setIsLoggedInMode(true);
        let query = supabase.from('flashcards').select('*');

        if (isCurrentRoomWritable) {
          // In personal space or own room, fetch all of the user's flashcards
          query = query.eq('user_id', session.user.id);
        } else {
          // In someone else's room, fetch only flashcards for that room
          query = query.eq('room_id', currentRoomId);
        }

        const { data: supabaseCards, error: fetchError } = await query.order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        const localCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        let localCards: CardData[] = [];
        if (localCardsString) {
          try {
            localCards = JSON.parse(localCardsString);
          } catch (e) {
            console.error("Error parsing local storage cards:", e);
          }
        }

        let mergedCards = [...(supabaseCards as CardData[])];
        if (localCards.length > 0) {
          const cardsToMigrate = localCards.filter(lc => !mergedCards.some(sc => sc.front === lc.front && sc.back === lc.back));
          if (cardsToMigrate.length > 0) {
            const { data: newSupabaseCards, error: insertError } = await supabase
              .from('flashcards')
              .insert(cardsToMigrate.map(c => ({ ...c, user_id: session.user.id, room_id: null, id: undefined, created_at: undefined })))
              .select();
            if (insertError) {
              toast.error("Error migrating some local cards.");
            } else if (newSupabaseCards) {
              mergedCards.push(...newSupabaseCards as CardData[]);
              toast.success("Local flashcards migrated to your account!");
            }
          }
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        setCards(mergedCards);
      } else {
        setIsLoggedInMode(false);
        const storedCardsString = localStorage.getItem(LOCAL_STORAGE_KEY);
        setCards(storedCardsString ? JSON.parse(storedCardsString) : []);
      }
    } catch (error: any) {
      toast.error("Failed to load flashcards: " + error.message);
      console.error("Error fetching flashcards:", error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [session, supabase, currentRoomId, isCurrentRoomWritable]);

  useEffect(() => {
    if (!authLoading) {
      fetchCards();
    }
  }, [authLoading, fetchCards]);

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