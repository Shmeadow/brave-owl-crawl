"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useFlashcards, CardData } from "@/hooks/use-flashcards";
import { toast } from "sonner";
import { SupabaseClient } from "@supabase/supabase-js";

export interface FlashMatch {
  id: string;
  room_id: string;
  creator_id: string;
  status: 'lobby' | 'in_progress' | 'completed' | 'cancelled';
  current_round_number: number;
  total_rounds: number;
  game_mode: string;
  created_at: string;
  updated_at: string;
  round_duration_seconds: number;
}

export interface FlashMatchPlayer {
  id: string;
  match_id: string;
  user_id: string;
  score: number;
  status: 'active' | 'kicked' | 'left';
  joined_at: string;
  last_answer_time: string | null;
  profiles?: { first_name: string | null; last_name: string | null } | null;
}

export interface FlashMatchRound {
  id: string;
  match_id: string;
  round_number: number;
  card_id: string;
  question: string;
  correct_answer: string;
  start_time: string;
  end_time: string | null;
  winner_player_id: string | null;
  round_end_time: string | null;
}

export interface FlashMatchPlayerAnswer {
  id: string;
  round_id: string;
  player_id: string;
  answer_text: string;
  is_correct: boolean;
  score_awarded: number;
  response_time: number;
  created_at: string;
  profiles?: { first_name: string | null; last_name: string | null } | null;
}

interface FlashMatchState {
  currentMatch: FlashMatch | null;
  players: FlashMatchPlayer[];
  currentRound: FlashMatchRound | null;
  playerAnswers: FlashMatchPlayerAnswer[];
  loading: boolean;
  error: string | null;
  roundTimeLeft: number | null;
}

export function useFlashMatch() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const { currentRoomId } = useCurrentRoom();
  const { cards, loading: cardsLoading } = useFlashcards(); // To get available flashcards

  const [state, setState] = useState<FlashMatchState>({
    currentMatch: null,
    players: [],
    currentRound: null,
    playerAnswers: [],
    loading: true,
    error: null,
    roundTimeLeft: null,
  });

  const channelRef = useRef<any>(null);
  const roundTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const invokeEdgeFunction = useCallback(async (action: string, payload: any) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to perform this action.");
      return { data: null, error: new Error("Not authenticated") };
    }

    try {
      const response = await fetch('https://mrdupsekghsnbooyrdmj.supabase.co/functions/v1/flashmatch-game-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(`FlashMatch Error: ${data.error || 'Unknown error'}`);
        console.error(`FlashMatch Edge Function Error (${action}):`, data.error);
        return { data: null, error: new Error(data.error || 'Unknown error') };
      }
      return { data, error: null };
    } catch (err: any) {
      toast.error(`Network Error: ${err.message}`);
      console.error(`FlashMatch Network Error (${action}):`, err);
      return { data: null, error: err };
    }
  }, [session]);

  const fetchMatchData = useCallback(async (matchId: string) => {
    if (!supabase) return;
    setState(prev => ({ ...prev, loading: true }));

    const { data: match, error: matchError } = await supabase
      .from('flash_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) {
      console.error("Error fetching match:", matchError);
      setState(prev => ({ ...prev, error: matchError.message, loading: false }));
      return;
    }

    const { data: players, error: playersError } = await supabase
      .from('flash_match_players')
      .select('*, profiles(first_name, last_name)')
      .eq('match_id', matchId);

    if (playersError) {
      console.error("Error fetching players:", playersError);
      setState(prev => ({ ...prev, error: playersError.message, loading: false }));
      return;
    }

    let currentRound: FlashMatchRound | null = null;
    let playerAnswers: FlashMatchPlayerAnswer[] = [];

    if (match.status === 'in_progress' && match.current_round_number > 0) {
      const { data: round, error: roundError } = await supabase
        .from('flash_match_rounds')
        .select('*')
        .eq('match_id', matchId)
        .eq('round_number', match.current_round_number)
        .single();

      if (roundError) {
        console.error("Error fetching current round:", roundError);
        setState(prev => ({ ...prev, error: roundError.message, loading: false }));
        return;
      }
      currentRound = round;

      const { data: answers, error: answersError } = await supabase
        .from('flash_match_player_answers')
        .select('*, profiles(first_name, last_name)')
        .eq('round_id', currentRound.id);

      if (answersError) {
        console.error("Error fetching player answers:", answersError);
        setState(prev => ({ ...prev, error: answersError.message, loading: false }));
        return;
      }
      playerAnswers = answers;
    }

    setState(prev => ({
      ...prev,
      currentMatch: match,
      players: players as FlashMatchPlayer[],
      currentRound: currentRound,
      playerAnswers: playerAnswers as FlashMatchPlayerAnswer[],
      loading: false,
      error: null,
    }));
  }, [supabase]);

  // Effect to find an active match in the current room or create a new lobby
  useEffect(() => {
    if (authLoading || !supabase || !currentRoomId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    const findOrCreateMatch = async () => {
      setState(prev => ({ ...prev, loading: true }));
      const { data: existingMatch, error: fetchError } = await supabase
        .from('flash_matches')
        .select('*')
        .eq('room_id', currentRoomId)
        .in('status', ['lobby', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching existing match:", fetchError);
        setState(prev => ({ ...prev, error: fetchError.message, loading: false }));
        return;
      }

      if (existingMatch) {
        await fetchMatchData(existingMatch.id);
      } else {
        // No active match, create a new lobby
        const { data: newMatch, error: createError } = await supabase
          .from('flash_matches')
          .insert({ room_id: currentRoomId, creator_id: session?.user?.id, status: 'lobby' })
          .select()
          .single();

        if (createError) {
          console.error("Error creating new match lobby:", createError);
          setState(prev => ({ ...prev, error: createError.message, loading: false }));
          return;
        }
        await fetchMatchData(newMatch.id);
      }
    };

    findOrCreateMatch();
  }, [authLoading, supabase, currentRoomId, session, fetchMatchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!supabase || !state.currentMatch?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const matchId = state.currentMatch.id;
    const channel = supabase.channel(`flashmatch:${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_matches', filter: `id=eq.${matchId}` }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setState(prev => ({ ...prev, currentMatch: payload.new as FlashMatch }));
          fetchMatchData(matchId); // Re-fetch all related data for consistency
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_match_players', filter: `match_id=eq.${matchId}` }, (payload) => {
        fetchMatchData(matchId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_match_rounds', filter: `match_id=eq.${matchId}` }, (payload) => {
        fetchMatchData(matchId);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flash_match_player_answers', filter: `round_id=in.(select id from flash_match_rounds where match_id = '${matchId}')` }, (payload) => {
        fetchMatchData(matchId);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, state.currentMatch?.id, fetchMatchData]);

  // Round Timer Logic
  useEffect(() => {
    if (roundTimerIntervalRef.current) {
      clearInterval(roundTimerIntervalRef.current);
      roundTimerIntervalRef.current = null;
    }

    if (state.currentMatch?.status === 'in_progress' && state.currentRound?.round_end_time) {
      const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const endTime = new Date(state.currentRound!.round_end_time).getTime();
        const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
        setState(prev => ({ ...prev, roundTimeLeft: timeLeft }));

        if (timeLeft === 0) {
          clearInterval(roundTimerIntervalRef.current!);
          // The Edge Function will handle round advancement, so no client-side action needed here.
        }
      };

      calculateTimeLeft(); // Initial calculation
      roundTimerIntervalRef.current = setInterval(calculateTimeLeft, 1000);
    } else {
      setState(prev => ({ ...prev, roundTimeLeft: null }));
    }

    return () => {
      if (roundTimerIntervalRef.current) {
        clearInterval(roundTimerIntervalRef.current);
      }
    };
  }, [state.currentMatch?.status, state.currentRound?.round_end_time]);


  const joinMatch = useCallback(async (matchId: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to join a match.");
      return;
    }
    const { error } = await invokeEdgeFunction('join_match', { matchId });
    if (!error) {
      toast.success("Joined FlashMatch lobby!");
    }
  }, [session, invokeEdgeFunction]);

  const startMatch = useCallback(async (matchId: string, totalRounds: number = 5) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to start a match.");
      return;
    }
    if (!currentRoomId) {
      toast.error("Match must be in a room.");
      return;
    }
    if (cards.length < totalRounds) {
      toast.error(`Not enough flashcards in your deck (${cards.length}) for ${totalRounds} rounds. Add more cards!`);
      return;
    }
    const { error } = await invokeEdgeFunction('start_match', { roomId: currentRoomId, totalRounds });
    if (!error) {
      toast.success("FlashMatch started!");
    }
  }, [session, invokeEdgeFunction, currentRoomId, cards]);

  const submitAnswer = useCallback(async (matchId: string, roundNumber: number, answerText: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to submit an answer.");
      return;
    }
    if (!answerText.trim()) {
      toast.error("Answer cannot be empty.");
      return;
    }
    const { error } = await invokeEdgeFunction('submit_answer', { matchId, roundNumber, answerText });
    if (!error) {
      toast.success("Answer submitted!");
    }
  }, [session, invokeEdgeFunction]);

  const passRound = useCallback(async (matchId: string, roundNumber: number) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to pass a round.");
      return;
    }
    const { error } = await invokeEdgeFunction('pass_round', { matchId, roundNumber });
    if (!error) {
      toast.info("Round passed.");
    }
  }, [session, invokeEdgeFunction]);

  const stopMatch = useCallback(async (matchId: string) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to stop a match.");
      return;
    }
    const { error } = await invokeEdgeFunction('stop_match', { matchId });
    if (!error) {
      toast.info("FlashMatch stopped.");
    }
  }, [session, invokeEdgeFunction]);

  return {
    ...state,
    isLoggedIn: !!session,
    userId: session?.user?.id,
    joinMatch,
    startMatch,
    submitAnswer,
    passRound,
    stopMatch,
  };
}