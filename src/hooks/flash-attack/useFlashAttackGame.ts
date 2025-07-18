"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { FlashMatch, FlashMatchPlayer, FlashMatchRound, FlashMatchPlayerAnswer } from "./types";
import { useFlashcardCategories } from "../flashcards/useFlashcardCategories"; // Import categories hook
import { invokeEdgeFunction } from "@/lib/supabase-edge-functions"; // Import the new utility

export function useFlashAttackGame() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const { categories, loading: categoriesLoading } = useFlashcardCategories();

  const [activeMatches, setActiveMatches] = useState<FlashMatch[]>([]);
  const [currentMatch, setCurrentMatch] = useState<FlashMatch | null>(null);
  const [playersInCurrentMatch, setPlayersInCurrentMatch] = useState<FlashMatchPlayer[]>([]);
  const [currentRound, setCurrentRound] = useState<FlashMatchRound | null>(null);
  const [currentRoundAnswers, setCurrentRoundAnswers] = useState<FlashMatchPlayerAnswer[]>([]); // New state for answers
  const [loading, setLoading] = useState(true);
  const [roundCountdown, setRoundCountdown] = useState(0); // New state for countdown
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Define userId here
  const userId = session?.user?.id || null;

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((duration: number, startTime: string) => {
    clearCountdown();
    const roundStartTime = new Date(startTime).getTime();
    const endTime = roundStartTime + duration * 1000;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      setRoundCountdown(timeLeft);
      if (timeLeft === 0) {
        clearCountdown();
      }
    };

    updateCountdown(); // Initial call
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  }, [clearCountdown]);

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

  const fetchPlayersRoundsAndAnswers = useCallback(async (matchId: string, currentRoundNumber: number | null) => {
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
    if (currentMatch?.status === 'in_progress' && currentRoundNumber) {
      const { data: roundsData, error: roundsError } = await supabase
        .from('flash_match_rounds')
        .select('*')
        .eq('match_id', matchId)
        .eq('round_number', currentRoundNumber)
        .single();

      if (roundsError && roundsError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching current round:", roundsError);
        setCurrentRound(null);
        setCurrentRoundAnswers([]);
        clearCountdown();
      } else if (roundsData) {
        setCurrentRound(roundsData as FlashMatchRound);
        if (roundsData.start_time && !roundsData.round_end_time) {
          startCountdown(currentMatch.round_duration_seconds, roundsData.start_time);
        } else {
          clearCountdown();
        }

        // Fetch answers for the current round
        const { data: answersData, error: answersError } = await supabase
          .from('flash_match_player_answers')
          .select('*, profiles(first_name, last_name, profile_image_url)')
          .eq('round_id', roundsData.id)
          .order('created_at', { ascending: true }); // Order by submission time

        if (answersError) {
          console.error("Error fetching round answers:", answersError);
          setCurrentRoundAnswers([]);
        } else {
          const answers: FlashMatchPlayerAnswer[] = answersData.map(a => ({
            ...a,
            profiles: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
          })) as FlashMatchPlayerAnswer[];
          setCurrentRoundAnswers(answers);
        }

      } else {
        setCurrentRound(null);
        setCurrentRoundAnswers([]);
        clearCountdown();
      }
    } else {
      setCurrentRound(null);
      setCurrentRoundAnswers([]);
      clearCountdown();
    }
  }, [supabase, currentMatch?.status, currentMatch?.round_duration_seconds, startCountdown, clearCountdown]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  useEffect(() => {
    if (currentMatch?.id) {
      fetchPlayersRoundsAndAnswers(currentMatch.id, currentMatch.current_round_number);
    } else {
      setPlayersInCurrentMatch([]);
      setCurrentRound(null);
      setCurrentRoundAnswers([]);
      clearCountdown();
    }
  }, [currentMatch, fetchPlayersRoundsAndAnswers, clearCountdown]);

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
          fetchPlayersRoundsAndAnswers(currentMatch.id, currentMatch.current_round_number); // Re-fetch players and rounds
        })
        .subscribe();
    }

    // Subscribe to flash_match_rounds changes for the current match
    let roundsChannel: any;
    if (currentMatch?.id) {
      roundsChannel = supabase
        .channel(`flash_match_rounds_match_${currentMatch.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_match_rounds', filter: `match_id=eq.${currentMatch.id}` }, (payload) => {
          fetchPlayersRoundsAndAnswers(currentMatch.id, currentMatch.current_round_number); // Re-fetch players and rounds
        })
        .subscribe();
    }

    // Subscribe to flash_match_player_answers changes for the current match
    let answersChannel: any;
    if (currentMatch?.id && currentRound?.id) {
      answersChannel = supabase
        .channel(`flash_match_player_answers_round_${currentRound.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_match_player_answers', filter: `round_id=eq.${currentRound.id}` }, (payload) => {
          fetchPlayersRoundsAndAnswers(currentMatch.id, currentMatch.current_round_number); // Re-fetch answers
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(matchesChannel);
      if (playersChannel) supabase.removeChannel(playersChannel);
      if (roundsChannel) supabase.removeChannel(roundsChannel);
      if (answersChannel) supabase.removeChannel(answersChannel);
    };
  }, [supabase, currentRoomId, currentMatch?.id, currentRound?.id, fetchMatches, fetchPlayersRoundsAndAnswers]);

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
      await invokeEdgeFunction('create-flash-match', {
        method: 'POST',
        body: {
          room_id: currentRoomId,
          total_rounds,
          game_mode,
          round_duration_seconds,
          deck_category_id,
        },
        accessToken: session.access_token,
      });
      toast.success("Flash Attack match created!");
      fetchMatches(); // Re-fetch to update UI with new match
    } catch (error: any) {
      toast.error(`Failed to create match: ${error.message}`);
      console.error("Create match error:", error);
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
      await invokeEdgeFunction('join-flash-match', {
        method: 'POST',
        body: { match_id: matchId },
        accessToken: session.access_token,
      });
      toast.success("Joined Flash Attack match!");
      fetchMatches(); // Re-fetch to update UI
    }
    catch (error: any) {
      toast.error(`Failed to join match: ${error.message}`);
      console.error("Join match error:", error);
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
      await invokeEdgeFunction('start-flash-match', {
        method: 'POST',
        body: { match_id: matchId },
        accessToken: session.access_token,
      });
      toast.success("Flash Attack match started!");
      fetchMatches(); // Re-fetch to update UI
    } catch (error: any) {
      toast.error(`Failed to start match: ${error.message}`);
      console.error("Start match error:", error);
    }
  }, [session, supabase, fetchMatches]);

  const nextRound = useCallback(async (matchId: string) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to advance rounds.");
      return;
    }
    if (!supabase) {
      toast.error("Supabase client not available.");
      return;
    }

    try {
      await invokeEdgeFunction('next-flash-round', {
        method: 'POST',
        body: { match_id: matchId },
        accessToken: session.access_token,
      });
      toast.success("Round advanced!");
      fetchMatches(); // Re-fetch to update UI
    } catch (error: any) {
      toast.error(`Failed to advance round: ${error.message}`);
      console.error("Next round error:", error);
    }
  }, [session, supabase, fetchMatches]);

  const submitAnswer = useCallback(async (matchId: string, roundId: string, answerText: string, responseTimeMs: number) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to submit an answer.");
      return;
    }
    if (!supabase) {
      toast.error("Supabase client not available.");
      return;
    }

    try {
      const data = await invokeEdgeFunction('submit-flash-answer', {
        method: 'POST',
        body: {
          match_id: matchId,
          round_id: roundId,
          answer_text: answerText,
          response_time_ms: responseTimeMs,
        },
        accessToken: session.access_token,
      });
      toast.success((data as any).is_correct ? "Correct answer!" : "Incorrect answer.");
      fetchPlayersRoundsAndAnswers(matchId, currentMatch?.current_round_number || null); // Re-fetch to update scores and answers
    } catch (error: any) {
      toast.error(`Failed to submit answer: ${error.message}`);
      console.error("Submit answer error:", error);
    }
  }, [session, supabase, fetchPlayersRoundsAndAnswers, currentMatch?.current_round_number]);

  const leaveMatch = useCallback(async (matchId: string) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to leave a match.");
      return;
    }
    if (!supabase) {
      toast.error("Supabase client not available.");
      return;
    }

    try {
      await invokeEdgeFunction('leave-flash-match', {
        method: 'POST',
        body: { match_id: matchId },
        accessToken: session.access_token,
      });
      toast.success("Successfully left the match.");
      fetchMatches(); // Re-fetch to update UI
    } catch (error: any) {
      toast.error(`Failed to leave match: ${error.message}`);
      console.error("Leave match error:", error);
    }
  }, [session, supabase, fetchMatches]);

  const cancelMatch = useCallback(async (matchId: string) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to cancel a match.");
      return;
    }
    if (!supabase) {
      toast.error("Supabase client not available.");
      return;
    }

    try {
      await invokeEdgeFunction('cancel-flash-match', {
        method: 'POST',
        body: { match_id: matchId },
        accessToken: session.access_token,
      });
      toast.success("Match cancelled successfully.");
      fetchMatches(); // Re-fetch to update UI
    } catch (error: any) {
      toast.error(`Failed to cancel match: ${error.message}`);
      console.error("Cancel match error:", error);
    }
  }, [session, supabase, fetchMatches]);

  return {
    activeMatches,
    currentMatch,
    playersInCurrentMatch,
    currentRound,
    currentRoundAnswers, // Expose answers
    loading: loading || categoriesLoading,
    roundCountdown, // Expose countdown
    createMatch,
    joinMatch,
    startMatch,
    nextRound, // Expose nextRound
    submitAnswer, // Expose submitAnswer
    leaveMatch, // Expose leaveMatch
    cancelMatch, // Expose cancelMatch
    categories, // Expose categories for deck selection
    userId,
  };
}