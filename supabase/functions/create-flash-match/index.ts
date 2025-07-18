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
    const { room_id, total_rounds, game_mode, round_duration_seconds, deck_category_id } = await req.json();
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
    const creator_id = user.user.id;

    // 1. Create the flash_match entry
    const { data: newMatch, error: matchError } = await supabase
      .from('flash_matches')
      .insert({
        room_id,
        creator_id,
        total_rounds,
        game_mode,
        round_duration_seconds,
        deck_category_id,
        status: 'lobby',
        current_round_number: 0, // Lobby state, no rounds started
      })
      .select()
      .single();

    if (matchError || !newMatch) {
      console.error('Error creating match:', matchError?.message);
      return new Response(JSON.stringify({ error: 'Failed to create match: ' + matchError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 2. Add the creator as the first player
    const { error: playerError } = await supabase
      .from('flash_match_players')
      .insert({
        match_id: newMatch.id,
        user_id: creator_id,
        score: 0,
        status: 'active',
      });

    if (playerError) {
      console.error('Error adding creator as player:', playerError?.message);
      // Optionally, roll back match creation here if player insertion is critical
      return new Response(JSON.stringify({ error: 'Failed to add creator to match: ' + playerError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Match created successfully', match_id: newMatch.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in create-flash-match function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});