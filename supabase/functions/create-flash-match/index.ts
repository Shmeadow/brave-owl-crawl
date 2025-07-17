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

    // Verify user is the creator of the room or has access to it
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', room_id)
      .single();

    if (roomError || !room) {
      console.error('Room fetch error:', roomError?.message);
      return new Response(JSON.stringify({ error: 'Room not found or access denied' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (room.creator_id !== creator_id) {
      return new Response(JSON.stringify({ error: 'Forbidden: You are not the room creator' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Check if there's an active match in this room
    const { data: activeMatches, error: activeMatchError } = await supabase
      .from('flash_matches')
      .select('id')
      .eq('room_id', room_id)
      .in('status', ['lobby', 'in_progress']);

    if (activeMatchError) {
      console.error('Error checking active matches:', activeMatchError);
      return new Response(JSON.stringify({ error: 'Failed to check for active matches' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (activeMatches && activeMatches.length > 0) {
      return new Response(JSON.stringify({ error: 'An active Flash Attack match already exists in this room.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409, // Conflict
      });
    }

    // Create the new match
    const { data: newMatch, error: matchError } = await supabase
      .from('flash_matches')
      .insert({
        room_id,
        creator_id,
        total_rounds: total_rounds || 5,
        game_mode: game_mode || 'free_for_all',
        round_duration_seconds: round_duration_seconds || 30,
        deck_category_id: deck_category_id || null,
        status: 'lobby',
      })
      .select()
      .single();

    if (matchError) {
      console.error('Error creating match:', matchError);
      return new Response(JSON.stringify({ error: matchError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Add creator as the first player
    const { error: playerError } = await supabase
      .from('flash_match_players')
      .insert({
        match_id: newMatch.id,
        user_id: creator_id,
      });

    if (playerError) {
      console.error('Error adding creator as player:', playerError);
      // Consider rolling back match creation here if player insertion is critical
      return new Response(JSON.stringify({ error: playerError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ match: newMatch }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });

  } catch (error: any) {
    console.error('Error in create-flash-match function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});