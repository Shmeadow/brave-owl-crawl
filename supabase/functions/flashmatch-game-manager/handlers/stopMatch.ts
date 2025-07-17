// @ts-ignore
/// <reference lib="deno.ns" />
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

interface StopMatchPayload {
  matchId: string;
}

export async function stopMatchHandler(supabaseAdmin: SupabaseClient, userId: string, payload: StopMatchPayload) {
  const { matchId } = payload;

  const { data: match, error: matchFetchError } = await supabaseAdmin
    .from('flash_matches')
    .select('id, creator_id, status')
    .eq('id', matchId)
    .single();

  if (matchFetchError || !match) {
    throw new Error('Match not found.');
  }
  if (match.creator_id !== userId) {
    throw new Error('Only the match creator can stop the game.');
  }
  if (match.status !== 'in_progress') {
    throw new Error('Match is not in progress.');
  }

  const { data, error } = await supabaseAdmin
    .from('flash_matches')
    .update({ status: 'cancelled' })
    .eq('id', matchId)
    .select()
    .single();
  if (error) throw error;

  return { message: 'Match stopped successfully', match: data };
}