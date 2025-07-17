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
    const { match_id } = await req.json();
    const authHeader = req.headers.get('Authorization');

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
    const caller_id = user.user.id;

    // 1. Fetch match details and verify creator
    const { data: match, error: matchError } = await supabase
      .from('flash_matches')
      .select('id, creator_id, status, current_round_number, total_rounds')
      .eq('id', match_id)
      .single();

    if (matchError || !match) {
      console.error('Match fetch error:', matchError?.message);
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (match.creator_id !== caller_id) {
      return new Response(JSON.stringify({ error: 'Forbidden: Only the match creator can advance rounds' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    if (match.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: `Match is not in progress. Current status: ${match.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. End the current round (if one exists and is active)
    const { data: currentRound, error: currentRoundError } = await supabase
      .from('flash_match_rounds')
      .select('id')
      .eq('match_id', match_id)
      .eq('round_number', match.current_round_number)
      .is('round_end_time', null) // Only end if not already ended
      .single();

    if (currentRoundError && currentRoundError.code !== 'PGRST116') {
      console.error('Error fetching current round to end:', currentRoundError?.message);
      // Continue, as it might just be that the round was already ended or not found
    } else if (currentRound) {
      const { error: updateRoundError } = await supabase
        .from('flash_match_rounds')
        .update({ round_end_time: new Date().toISOString() })
        .eq('id', currentRound.id);
      if (updateRoundError) {
        console.error('Error ending current round:', updateRoundError?.message);
      }
    }

    // 3. Determine next round number and update match status
    const nextRoundNumber = match.current_round_number + 1;
    let newMatchStatus = 'in_progress';
    let nextRoundStartTime = null;

    if (nextRoundNumber > match.total_rounds) {
      newMatchStatus = 'completed';
    } else {
      // Set start_time for the next round
      const { data: nextRoundData, error: fetchNextRoundError } = await supabase
        .from('flash_match_rounds')
        .select('id')
        .eq('match_id', match_id)
        .eq('round_number', nextRoundNumber)
        .single();

      if (fetchNextRoundError || !nextRoundData) {
        console.error('Error fetching next round to start:', fetchNextRoundError?.message);
        return new Response(JSON.stringify({ error: 'Failed to find next round data.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      nextRoundStartTime = new Date().toISOString();
      const { error: updateNextRoundError } = await supabase
        .from('flash_match_rounds')
        .update({ start_time: nextRoundStartTime })
        .eq('id', nextRoundData.id);

      if (updateNextRoundError) {
        console.error('Error starting next round:', updateNextRoundError?.message);
        return new Response(JSON.stringify({ error: 'Failed to start the next round.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    }

    // 4. Update match state
    const { data: updatedMatch, error: updateMatchError } = await supabase
      .from('flash_matches')
      .update({
        current_round_number: nextRoundNumber,
        status: newMatchStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id)
      .select()
      .single();

    if (updateMatchError || !updatedMatch) {
      console.error('Error updating match status for next round:', updateMatchError?.message);
      return new Response(JSON.stringify({ error: 'Failed to update match state.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Round advanced successfully', match: updatedMatch }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in next-flash-round function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});