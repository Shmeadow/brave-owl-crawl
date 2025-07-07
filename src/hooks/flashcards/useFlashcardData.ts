"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { CardData } from "./types";
import { usePersistentData } from "../use-persistent-data"; // Import the new hook

interface DbCard {
  id: string;
  user_id: string;
  category_id: string | null;
  front: string;
  back: string;
  starred: boolean;
  status: 'Learning' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastered';
  seen_count: number;
  last_reviewed_at: string | null;
  interval_days: number;
  correct_guesses: number;
  incorrect_guesses: number;
  created_at: string;
  ease_factor: number;
}

const LOCAL_STORAGE_KEY = 'guest_flashcards';
const SUPABASE_TABLE_NAME = 'flashcards';

export function useFlashcardData() {
  const { supabase, session } = useSupabase();

  const {
    data: cards,
    loading,
    isLoggedInMode,
    setData: setCards,
    fetchData,
  } = usePersistentData<CardData[], DbCard>({ // T_APP_DATA is CardData[], T_DB_DATA_ITEM is DbCard
    localStorageKey: LOCAL_STORAGE_KEY,
    supabaseTableName: SUPABASE_TABLE_NAME,
    initialValue: [],
    selectQuery: '*',
    transformFromDb: (dbCards: DbCard[]) => dbCards.map(card => ({
      id: card.id,
      user_id: card.user_id,
      category_id: card.category_id,
      front: card.front,
      back: card.back,
      starred: card.starred,
      status: card.status,
      seen_count: card.seen_count,
      last_reviewed_at: card.last_reviewed_at,
      interval_days: card.interval_days,
      correct_guesses: card.correct_guesses,
      incorrect_guesses: card.incorrect_guesses,
      created_at: card.created_at,
      ease_factor: card.ease_factor,
    })),
    transformToDb: (appCard: CardData, userId: string) => ({ // appItem is CardData, returns DbCard
      id: appCard.id,
      user_id: userId,
      category_id: appCard.category_id || null,
      front: appCard.front,
      back: appCard.back,
      starred: appCard.starred,
      status: appCard.status,
      seen_count: appCard.seen_count,
      last_reviewed_at: appCard.last_reviewed_at,
      interval_days: appCard.interval_days,
      correct_guesses: appCard.correct_guesses,
      incorrect_guesses: appCard.incorrect_guesses,
      created_at: appCard.created_at,
      ease_factor: appCard.ease_factor,
    }),
    userIdColumn: 'user_id',
    onConflictColumn: 'id',
    debounceDelay: 0,
  });

  return {
    cards,
    setCards,
    loading,
    isLoggedInMode,
    session,
    supabase,
    fetchData,
  };
}