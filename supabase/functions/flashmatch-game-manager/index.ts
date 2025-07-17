// @ts-ignore
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to calculate closeness for answers
const calculateCloseness = (userAns: string, correctDef: string): number => {
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

// Helper to advance the round or end the match
async function advanceRoundOrEndMatch(supabaseAdmin: any, matchId: string, currentRoundNumber: number, totalRounds: number) {
  const nextRoundNumber = currentRoundNumber + 1;
  if (nextRoundNumber <= totalRounds) {
    // Start the next round
    const { data: nextRound, error: nextRoundError } = await supabaseAdmin
      .from('flash_match_rounds')
      .update({ start_time: new Date().toISOString(), round_end_time: new Date(Date.now() + 30 * 1000).toISOString() }) // Default 30s for now
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: user, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user.user) {
      console.error('Auth error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.user.id;

    let responseData: any;
    let statusCode = 200;

    switch (action) {
      case 'start_match': {
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
        const { data: firstRound, error: firstRoundError } = await supabaseAdmin
          .from('flash_match_rounds')
          .update({ start_time: new Date().toISOString(), round_end_time: new Date(Date.now() + (matchToUpdate.round_duration_seconds || 30) * 1000).toISOString() })
          .eq('match_id', matchToUpdate.id)
          .eq('round_number', 1)
          .select()
          .single();
        if (firstRoundError) throw firstRoundError;

        const { error: updateMatchRoundError } = await supabaseAdmin
          .from('flash_matches')
          .update({ current_round_number: 1 })
          .eq('id', matchToUpdate.id);
        if (updateMatchRoundError) throw updateMatchRoundError;

        responseData = { ...matchToUpdate, current_round_data: firstRound };
        break;
      }

      case 'join_match': {
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
        responseData = data;
        break;
      }

      case 'submit_answer': {
        const { matchId, roundNumber, answerText } = payload;

        const { data: match, error: matchFetchError } = await supabaseAdmin
          .from('flash_matches')
          .select('id, status, current_round_number, total_rounds')
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

        responseData = { newAnswer, player };

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

          await advanceRoundOrEndMatch(supabaseAdmin, matchId, roundNumber, match.total_rounds);
        }
        break;
      }

      case 'pass_round': {
        const { matchId, roundNumber } = payload;

        const { data: match, error: matchFetchError } = await supabaseAdmin
          .from('flash_matches')
          .select('id, status, current_round_number, total_rounds')
          .eq('id', matchId)
          .single();

        if (matchFetchError || !match || match.status !== 'in_progress' || match.current_round_number !== roundNumber) {
          throw new Error('Match not in progress or invalid round.');
        }

        const { data: currentRound, error: roundError } = await supabaseAdmin
          .from('flash_match_rounds')
          .select('id, start_time, round_end_time')
          .eq('match_id', matchId)
          .eq('round_number', roundNumber)
          .single();

        if (roundError || !currentRound) {
          throw new Error('Current round not found.');
        }

        // Check if player has already answered/passed this round
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

        const scoreAwarded = isLate ? 0 : -1; // -1 point for passing, 0 if late

        const responseTime = Math.floor((now.getTime() - new Date(currentRound.start_time).getTime()) / 1000); // in seconds

        const { data: newAnswer, error: insertAnswerError } = await supabaseAdmin
          .from('flash_match_player_answers')
          .insert({
            round_id: currentRound.id,
            player_id: userId,
            answer_text: '[PASSED]',
            is_correct: false, // Passing is not correct
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

        responseData = { newAnswer, player };

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

          await advanceRoundOrEndMatch(supabaseAdmin, matchId, roundNumber, match.total_rounds);
        }
        break;
      }

      case 'stop_match': {
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
        responseData = data;
        break;
      }

      default:
        statusCode = 400;
        responseData = { error: 'Invalid action' };
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode,
    });
  } catch (error: unknown) {
    console.error('FlashMatch Edge Function Error:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});