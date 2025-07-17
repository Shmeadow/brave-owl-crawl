// @ts-ignore
/// <reference lib="deno.ns" />
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// @ts-ignore
import { advanceRoundOrEndMatch } from '../utils.ts';

interface StartMatchPayload {
  roomId: string;
  totalRounds?: number;
}

export async function startMatchHandler(supabaseAdmin: SupabaseClient, userId: string, payload: StartMatchPayload) {
  const { roomId, totalRounds = 5 } = payload;

  // Verify user is creator of the match or room
  const { data: existingMatch, error: matchError } = await supabaseAdmin
    .from('flash_matches')
    .select('id, creator_id, status, round_duration_seconds')
    .eq('room_id', roomId)
    .in('status', ['lobby', 'in_progress'])
    .single();

  if (matchError && matchError.code !== 'PGRST116') { // PGRST116 means no rows found
    console.error('Error checking existing match:', matchError);
    throw new Error('Failed to check for existing match.');
  }

  let matchToUpdate: any;
  if (existingMatch) {
    if (existingMatch.creator_id !== userId) {
      throw new Error('Only the match creator can start the game.');
    }
    if (existingMatch.status === 'in_progress') {
      throw new Error('Match is already in progress.');
    }
    // If in lobby, update status to in_progress
    const { data: updatedMatch, error: updateError } = await supabaseAdmin
      .from('flash_matches')
      .update({ status: 'in_progress', current_round_number: 0, total_rounds: totalRounds })
      .eq('id', existingMatch.id)
      .select()
      .single();
    if (updateError) throw updateError;
    matchToUpdate = updatedMatch;
  } else {
    // Create new match
    const { data: newMatch, error: insertError } = await supabaseAdmin
      .from('flash_matches')
      .insert({ room_id: roomId, creator_id: userId, status: 'in_progress', total_rounds: totalRounds })
      .select()
      .single();
    if (insertError) throw insertError;
    matchToUpdate = newMatch;
  }

  // Fetch flashcards for the room
  const { data: flashcards, error: cardsError } = await supabaseAdmin
    .from('flashcards')
    .select('id, front, back')
    .eq('room_id', roomId)
    .eq('user_id', userId); // Only use cards created by the match creator for now

  if (cardsError || !flashcards || flashcards.length === 0) {
    throw new Error('No flashcards found for this room or user to start a match.');
  }

  // Shuffle and select cards for rounds
  const shuffledCards = flashcards.sort(() => Math.random() - 0.5);
  const selectedCards = shuffledCards.slice(0, totalRounds);

  // Create rounds
  const roundsToInsert = selectedCards.map((card: { id: string; front: string; back: string; }, index: number) => ({
    match_id: matchToUpdate.id,
    round_number: index + 1,
    card_id: card.id,
    question: card.front,
    correct_answer: card.back,
    // round_end_time will be set when the round actually starts
  }));

  const { error: roundsInsertError } = await supabaseAdmin
    .from('flash_match_rounds')
    .insert(roundsToInsert);

  if (roundsInsertError) throw roundsInsertError;

  // Start the first round
  await advanceRoundOrEndMatch(supabaseAdmin, matchToUpdate.id, 0, totalRounds, matchToUpdate.round_duration_seconds || 30);

  return { message: 'Match started successfully', match: matchToUpdate };
}