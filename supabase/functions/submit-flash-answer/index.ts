// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { match_id, round_id, answer_text, response_time_ms } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!match_id || !round_id || answer_text === undefined || response_time_ms === undefined) {
      return new Response(JSON.stringify({ error: 'Match ID, Round ID, answer text, and response time are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: user, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user.user) {
      console.error('Auth error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const player_id = user.user.id;

    // 1. Verify player is part of the match and match is in progress
    const { data: playerEntry, error: playerEntryError } = await supabase
      .from('flash_match_players')
      .select('id, match_id, user_id, score')
      .eq('match_id', match_id)
      .eq('user_id', player_id)
      .single();

    if (playerEntryError || !playerEntry) {
      console.error('Player entry error:', playerEntryError?.message);
      return new Response(JSON.stringify({ error: 'Player not found in this match or match does not exist.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const { data: match, error: matchError } = await supabase
      .from('flash_matches')
      .select('status, current_round_number, round_duration_seconds')
      .eq('id', match_id)
      .single();

    if (matchError || !match || match.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: 'Match is not in progress or does not exist.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Get current round details
    const { data: round, error: roundError } = await supabase
      .from('flash_match_rounds')
      .select('id, correct_answer, start_time, round_number')
      .eq('id', round_id)
      .eq('match_id', match_id)
      .single();

    if (roundError || !round) {
      console.error('Round fetch error:', roundError?.message);
      return new Response(JSON.stringify({ error: 'Round not found or invalid.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (round.round_number !== match.current_round_number) {
        return new Response(JSON.stringify({ error: 'Answer submitted for an incorrect round number.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // Check if the round has already ended or if time is up
    const roundStartTime = new Date(round.start_time).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = (currentTime - roundStartTime) / 1000;

    if (elapsedSeconds > match.round_duration_seconds + 2) { // Add a small buffer
        return new Response(JSON.stringify({ error: 'Round has already ended or time is up.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // 3. Check if player has already answered this round
    const { data: existingAnswer, error: existingAnswerError } = await supabase
      .from('flash_match_player_answers')
      .select('id')
      .eq('round_id', round_id)
      .eq('player_id', player_id)
      .single();

    if (existingAnswerError && existingAnswerError.code !== 'PGRST116') {
      console.error('Error checking existing answer:', existingAnswerError);
      return new Response(JSON.stringify({ error: 'Failed to check existing answer.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (existingAnswer) {
      return new Response(JSON.stringify({ message: 'You have already submitted an answer for this round.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Evaluate answer and calculate score
    const is_correct = answer_text.toLowerCase().trim() === round.correct_answer.toLowerCase().trim();
    let score_awarded = 0;
    const BASE_POINTS = 10;
    const SPEED_BONUS = 5; // For the first correct answer

    if (is_correct) {
      score_awarded = BASE_POINTS;

      // Check if this is the first correct answer for this round
      const { data: firstCorrectAnswer, error: firstAnswerError } = await supabase
        .from('flash_match_player_answers')
        .select('id')
        .eq('round_id', round_id)
        .eq('is_correct', true)
        .limit(1);

      if (firstAnswerError) {
        console.error('Error checking for first correct answer:', firstAnswerError);
      } else if (!firstCorrectAnswer || firstCorrectAnswer.length === 0) {
        score_awarded += SPEED_BONUS; // Award speed bonus
      }
    } else {
      // Penalties for wrong answers (optional, based on game design)
      // score_awarded = -2; // Example penalty
    }

    // 5. Record answer
    const { data: newAnswer, error: insertAnswerError } = await supabase
      .from('flash_match_player_answers')
      .insert({
        round_id,
        player_id,
        answer_text,
        is_correct,
        score_awarded,
        response_time: response_time_ms,
      })
      .select()
      .single();

    if (insertAnswerError) {
      console.error('Error inserting player answer:', insertAnswerError);
      return new Response(JSON.stringify({ error: insertAnswerError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 6. Update player's total score
    const { error: updateScoreError } = await supabase
      .from('flash_match_players')
      .update({ score: playerEntry.score + score_awarded })
      .eq('id', playerEntry.id);

    if (updateScoreError) {
      console.error('Error updating player score:', updateScoreError);
      return new Response(JSON.stringify({ error: updateScoreError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Answer submitted successfully', is_correct, score_awarded, newAnswer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in submit-flash-answer function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});