// @ts-ignore
/// <reference lib="deno.ns" />
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface JoinMatchPayload {
  matchId: string;
}

export async function joinMatchHandler(supabaseAdmin: SupabaseClient, userId: string, payload: JoinMatchPayload) {
  const { matchId } = payload;

  const { data: match, error: matchFetchError } = await supabaseAdmin
    .from('flash_matches')
    .select('id, status, room_id')
    .eq('id', matchId)
    .single();

  if (matchFetchError || !match) {
    throw new Error('Match not found.');
  }
  if (match.status !== 'lobby') {
    throw new Error('Cannot join a match that is not in lobby status.');
  }

  // Check if user is already in the match
  const { data: existingPlayer, error: playerError } = await supabaseAdmin
    .from('flash_match_players')
    .select('id')
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .single();

  if (playerError && playerError.code !== 'PGRST116') {
    console.error('Error checking existing player:', playerError);
    throw new Error('Failed to check player status.');
  }

  if (existingPlayer) {
    throw new Error('You are already in this match.');
  }

  const { data, error } = await supabaseAdmin
    .from('flash_match_players')
    .insert({ match_id: matchId, user_id: userId })
    .select()
    .single();
  if (error) throw error;

  return { message: 'Joined match successfully', player: data };
}