"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { FlashMatch, FlashMatchPlayer, FlashMatchRound, FlashMatchPlayerAnswer } from "./types";
import { useFlashcardCategories } from "../flashcards/useFlashcardCategories"; // Import categories hook

export function useFlashAttackGame() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const { categories, loading: categoriesLoading } = useFlashcardCategories();

  const [activeMatches, setActiveMatches] = useState<FlashMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<FlashMatch | null>(null);
  const [playersInCurrentMatch, setPlayersInCurrentMatch] = useState<FlashMatchPlayer[]>([]);
  const [currentRound, setCurrentRound] = useState<FlashMatchRound | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "https://mrdupsekghsnbooyrdmj.supabase.co/functions/v1";

  const fetchMatches = useCallback(async () => {
    if (authLoading || !supabase || !currentRoomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('flash_matches')
      .select(`
        *,
        profiles(first_name, last_name, profile_image_url),
        flashcard_categories(name)
      `)
      .eq('room_id', currentRoomId)
      .in('status', ['lobby', 'in_progress'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching flash matches:", error);
      toast.error("Failed to load Flash Attack matches.");
      setActiveMatches([]);
    } else {
      const matches: FlashMatch[] = data.map(m => ({
        ...m,
        profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
        flashcard_categories: Array.isArray(m.flashcard_categories) ? m.flashcard_categories[0] : m.flashcard_categories,
      })) as FlashMatch[];
      setActiveMatches(matches);
      // If there's an active match, set it as current
      if (matches.length > 0) {
        setCurrentMatch(matches[0]);
      } else {
        setCurrentMatch(null);
      }
    }
    setLoading(false);
  }, [authLoading, supabase, currentRoomId]);

  const fetchPlayersAndRounds = useCallback(async (matchId: string) => {
    if (!supabase) return;

    // Fetch players
    const { data: playersData, error: playersError } = await supabase
      .from('flash_match_players')
      .select('*, profiles(first_name, last_name, profile_image_url)')
      .eq('match_id', matchId)
      .order('score', { ascending: false });

    if (playersError) {
      console.error("Error fetching match players:", playersError);
      setPlayersInCurrentMatch([]);
    } else {
      const players: FlashMatchPlayer[] = playersData.map(p => ({
        ...p,
        profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles,
      })) as FlashMatchPlayer[];
      setPlayersInCurrentMatch(players);
    }

    // Fetch current round if match is in progress
    if (currentMatch?.status === 'in_progress') {
      const { data: roundsData, error: roundsError } = await supabase
        .from('flash_match_rounds')
        .select('*')
        .eq('match_id', matchId)
        .eq('round_number', currentMatch.current_round_number)
        .single();

      if (roundsError && roundsError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching current round:", roundsError);
        setCurrentRound(null);
      } else if (roundsData) {
        setCurrentRound(roundsData as FlashMatchRound);
      } else {
        setCurrentRound(null);
      }
    } else {
      setCurrentRound(null);
    }
  }, [supabase, currentMatch?.status]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (currentMatch?.id) {
      fetchPlayersAndRounds(currentMatch.id);
    } else {
      setPlayersInCurrentMatch([]);
      setCurrentRound(null);
    }
  }, [currentMatch, fetchPlayersAndRounds]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabase || !currentRoomId) return;

    // Subscribe to flash_matches changes in the current room
    const matchesChannel = supabase
      .channel(`flash_matches_room_${currentRoomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_matches', filter: `room_id=eq.${currentRoomId}` }, (payload) => {
        fetchMatches(); // Re-fetch all matches to ensure consistency
      })
      .subscribe();

    // Subscribe to flash_match_players changes for the current match
    let playersChannel: any;
    if (currentMatch?.id) {
      playersChannel = supabase
        .channel(`flash_match_players_match_${currentMatch.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_match_players', filter: `match_id=eq.${currentMatch.id}` }, (payload) => {
          fetchPlayersAndRounds(currentMatch.id); // Re-fetch players and rounds
        })
        .subscribe();
    }

    // Subscribe to flash_match_rounds changes for the current match
    let roundsChannel: any;
    if (currentMatch?.id) {
      roundsChannel = supabase
        .channel(`flash_match_rounds_match_${currentMatch.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_match_rounds', filter: `match_id=eq.${currentMatch.id}` }, (payload) => {
          fetchPlayersAndRounds(currentMatch.id); // Re-fetch players and rounds
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(matchesChannel);
      if (playersChannel) supabase.removeChannel(playersChannel);
      if (roundsChannel) supabase.removeChannel(roundsChannel);
    };
  }, [supabase, currentRoomId, currentMatch?.id, fetchMatches, fetchPlayersAndRounds]);

  const createMatch = useCallback(async (
    total_rounds: number,
    game_mode: 'free_for_all' | 'team_battle' | '1v1_duel',
    round_duration_seconds: number,
    deck_category_id: string | null
  ) => {
    if (!session?.access_token || !currentRoomId) {
      toast.error("You must be logged in and in a room to create a match.");
      return;
    }
    if (!supabase) {
      toast.error("Supabase client not available.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/create-flash-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          room_id: currentRoomId,
          total_rounds,
          game_mode,
          round_duration_seconds,
          deck_category_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to create match: ${data.error || 'Unknown error'}`);
        console.error("Create match error:", data);
      } else {
        toast.success("Flash Attack match created!");
        fetchMatches(); // Re-fetch to update UI with new match
      }
    } catch (error: any) {
      toast.error(`Network error creating match: ${error.message}`);
      console.error("Network error creating match:", error);
    }
  }, [session, currentRoomId, supabase, fetchMatches]);

  const joinMatch = useCallback(async (matchId: string) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to join a match.");
      return;
    }
    if (!supabase) {
      toast.error("Supabase client not available.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/join-flash-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ match_id: matchId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to join match: ${data.error || 'Unknown error'}`);
        console.error("Join match error:", data);
      } else {
        toast.success("Joined Flash Attack match!");
        fetchMatches(); // Re-fetch to update UI
      }
    }
    catch (error: any) {
      toast.error(`Network error joining match: ${error.message}`);
      console.error("Network error joining match:", error);
    }
  }, [session, supabase, fetchMatches]);

  const startMatch = useCallback(async (matchId: string) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to start a match.");
      return;
    }
    if (!supabase) {
      toast.error("Supabase client not available.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/start-flash-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ match_id: matchId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`Failed to start match: ${data.error || 'Unknown error'}`);
        console.error("Start match error:", data);
      } else {
        toast.success("Flash Attack match started!");
        fetchMatches(); // Re-fetch to update UI
      }
    } catch (error: any) {
      toast.error(`Network error starting match: ${error.message}`);
      console.error("Network error starting match:", error);
    }
  }, [session, supabase, fetchMatches]);

  return {
    activeMatches,
    currentMatch,
    playersInCurrentMatch,
    currentRound,
    loading: loading || categoriesLoading,
    createMatch,
    joinMatch,
    startMatch,
    categories, // Expose categories for deck selection
    userId: session?.user?.id,
  };
}