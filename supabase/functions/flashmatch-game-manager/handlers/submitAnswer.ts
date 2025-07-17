// @ts-ignore
/// <reference lib="deno.ns" />
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
// @ts-ignore
import { calculateCloseness, advanceRoundOrEndMatch } from '../utils.ts';

interface SubmitAnswerPayload {
  matchId: string;
  roundNumber: number;
  answerText: string;
}

export async function submitAnswerHandler(supabaseAdmin: SupabaseClient, userId: string, payload: SubmitAnswerPayload) {
  const { matchId, roundNumber, answerText } = payload;

  const { data: match, error: matchFetchError } = await supabaseAdmin
    .from('flash_matches')
    .select('id, status, current_round_number, total_rounds, round_duration_seconds')
    .eq('id', matchId)
    .single();

  if (matchFetchError || !match || match.status !== 'in_progress' || match.current_round_number !== roundNumber) {
    throw new Error('Match not in progress or invalid round.');
  }

  const { data: currentRound, error: roundError } = await supabaseAdmin
    .from('flash_match_rounds')
    .select('id, correct_answer, start_time, round_end_time')
    .eq('match_id', matchId)
    .eq('round_number', roundNumber)
    .single();

  if (roundError || !currentRound) {
    throw new Error('Current round not found.');
  }

  // Check if player has already answered this round
  const { data: existingAnswer, error: answerCheckError } = await supabaseAdmin
    .from('flash_match_player_answers')
    .select('id')
    .eq('round_id', currentRound.id)
    .eq('player_id', userId)
    .single();

  if (answerCheckError && answerCheckError.code !== 'PGRST116') {
    console.error('Error checking existing answer:', answerCheckError);
    throw new Error('Failed to check answer status.');
  }

  if (existingAnswer) {
    throw new Error('You have already submitted an answer for this round.');
  }

  const now = new Date();
  const isLate = currentRound.round_end_time && now.getTime() > new Date(currentRound.round_end_time).getTime();

  const isCorrect = calculateCloseness(answerText, currentRound.correct_answer) >= 90; // 90% closeness for correct
  let scoreAwarded = 0;
  if (!isLate) {
    scoreAwarded = isCorrect ? 10 : -2;
  } else {
    scoreAwarded = 0; // No points for late answers
  }

  const responseTime = Math.floor((now.getTime() - new Date(currentRound.start_time).getTime()) / 1000); // in seconds

  // Check if this is the first correct answer for a speed bonus
  if (isCorrect && !isLate) {
    const { data: firstCorrectAnswer, error: firstAnswerError } = await supabaseAdmin
      .from('flash_match_player_answers')
      .select('id')
      .eq('round_id', currentRound.id)
      .eq('is_correct', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (firstAnswerError && firstAnswerError.code === 'PGRST116') { // No correct answers yet
      scoreAwarded += 5; // Speed bonus
    }
  }

  const { data: newAnswer, error: insertAnswerError } = await supabaseAdmin
    .from('flash_match_player_answers')
    .insert({
      round_id: currentRound.id,
      player_id: userId,
      answer_text: answerText,
      is_correct: isCorrect,
      score_awarded: scoreAwarded,
      response_time: responseTime,
    })
    .select()
    .single();
  if (insertAnswerError) throw insertAnswerError;

  // Update player's total score
  const { data: player, error: playerUpdateError } = await supabaseAdmin
    .from('flash_match_players')
    .update({ score: (await supabaseAdmin.from('flash_match_players').select('score').eq('match_id', matchId).eq('user_id', userId).single()).data!.score + scoreAwarded })
    .eq('match_id', matchId)
    .eq('user_id', userId)
    .select()
    .single();
  if (playerUpdateError) throw playerUpdateError;

  // Check if all active players have answered or time is up for them
  const { data: activePlayers, error: activePlayersError } = await supabaseAdmin
    .from('flash_match_players')
    .select('user_id')
    .eq('match_id', matchId)
    .eq('status', 'active');
  if (activePlayersError) throw activePlayersError;

  const { data: answeredPlayers, error: answeredPlayersError } = await supabaseAdmin
    .from('flash_match_player_answers')
    .select('player_id')
    .eq('round_id', currentRound.id);
  if (answeredPlayersError) throw answeredPlayersError;

  const allAnswered = activePlayers.every((p: { user_id: string }) => answeredPlayers.some((a: { player_id: string }) => a.player_id === p.user_id));

  if (allAnswered || (currentRound.round_end_time && now.getTime() >= new Date(currentRound.round_end_time).getTime())) {
    // End current round
    const { error: endRoundError } = await supabaseAdmin
      .from('flash_match_rounds')
      .update({ end_time: new Date().toISOString() })
      .eq('id', currentRound.id);
    if (endRoundError) throw endRoundError;

    await advanceRoundOrEndMatch(supabaseAdmin, matchId, roundNumber, match.total_rounds, match.round_duration_seconds || 30);
  }

  return { message: 'Answer submitted', newAnswer, player };
}