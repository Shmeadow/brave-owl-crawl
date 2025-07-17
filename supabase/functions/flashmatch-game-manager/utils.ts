// @ts-ignore
/// <reference lib="deno.ns" />
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

/**
 * Calculates the character-based closeness percentage between two strings.
 * Useful for grading user answers against correct definitions.
 * @param userAns The user's answer string.
 * @param correctDef The correct definition string.
 * @returns A percentage (0-100) indicating how close the user's answer is to the correct definition.
 */
export const calculateCloseness = (userAns: string, correctDef: string): number => {
  const user = userAns.toLowerCase().trim();
  const correct = correctDef.toLowerCase().trim();
  if (correct.length === 0) return 0;
  let matches = 0;
  for (let i = 0; i < Math.min(user.length, correct.length); i++) {
    if (user[i] === correct[i]) {
      matches++;
    }
  }
  return parseFloat(((matches / correct.length) * 100).toFixed(2));
};

/**
 * Advances the match to the next round or ends it if all rounds are complete.
 * @param supabaseAdmin Supabase client with service role key.
 * @param matchId The ID of the current match.
 * @param currentRoundNumber The current round number.
 * @param totalRounds The total number of rounds in the match.
 * @param roundDurationSeconds The duration of each round in seconds.
 */
export async function advanceRoundOrEndMatch(supabaseAdmin: SupabaseClient, matchId: string, currentRoundNumber: number, totalRounds: number, roundDurationSeconds: number) {
  const nextRoundNumber = currentRoundNumber + 1;
  if (nextRoundNumber <= totalRounds) {
    // Start the next round
    const { data: nextRound, error: nextRoundError } = await supabaseAdmin
      .from('flash_match_rounds')
      .update({ start_time: new Date().toISOString(), round_end_time: new Date(Date.now() + roundDurationSeconds * 1000).toISOString() })
      .eq('match_id', matchId)
      .eq('round_number', nextRoundNumber)
      .select()
      .single();
    if (nextRoundError) throw nextRoundError;

    const { error: updateMatchRoundError } = await supabaseAdmin
      .from('flash_matches')
      .update({ current_round_number: nextRoundNumber })
      .eq('id', matchId);
    if (updateMatchRoundError) throw updateMatchRoundError;
  } else {
    // Match ends
    const { error: endMatchError } = await supabaseAdmin
      .from('flash_matches')
      .update({ status: 'completed' })
      .eq('id', matchId);
    if (endMatchError) throw endMatchError;
  }
}