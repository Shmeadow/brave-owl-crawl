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

    if (!match_id) {
      return new Response(JSON.stringify({ error: 'Match ID is required' }), {
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

    // 1. Verify match exists and is in 'lobby' status
    const { data: match, error: matchError } = await supabase
      .from('flash_matches')
      .select('id, status')
      .eq('id', match_id)
      .single();

    if (matchError || !match) {
      console.error('Match fetch error:', matchError?.message);
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (match.status !== 'lobby') {
      return new Response(JSON.stringify({ error: `Cannot join match: status is ${match.status}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Check if player is already in the match
    const { data: existingPlayer, error: playerCheckError } = await supabase
      .from('flash_match_players')
      .select('id')
      .eq('match_id', match_id)
      .eq('user_id', player_id)
      .single();

    if (playerCheckError && playerCheckError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking existing player:', playerCheckError);
      return new Response(JSON.stringify({ error: 'Failed to check player status.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (existingPlayer) {
      return new Response(JSON.stringify({ message: 'Already joined this match.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Add player to the match
    const { error: insertPlayerError } = await supabase
      .from('flash_match_players')
      .insert({
        match_id,
        user_id: player_id,
        score: 0,
        status: 'active',
      });

    if (insertPlayerError) {
      console.error('Error adding player to match:', insertPlayerError?.message);
      return new Response(JSON.stringify({ error: 'Failed to join match: ' + insertPlayerError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Successfully joined match.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in join-flash-match function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});