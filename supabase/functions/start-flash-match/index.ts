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
      .select('id, creator_id, status, total_rounds, current_round_number, deck_category_id, round_duration_seconds')
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
      return new Response(JSON.stringify({ error: 'Forbidden: Only the match creator can start the game' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    if (match.status !== 'lobby') {
      return new Response(JSON.stringify({ error: `Match is already ${match.status}. Cannot start.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Verify at least 2 players have joined
    const { data: players, error: playersError } = await supabase
      .from('flash_match_players')
      .select('id')
      .eq('match_id', match_id);

    if (playersError) {
      console.error('Players fetch error:', playersError?.message);
      return new Response(JSON.stringify({ error: 'Failed to fetch players' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!players || players.length < 2) {
      return new Response(JSON.stringify({ error: 'At least 2 players are required to start the game.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. Fetch flashcards for the selected deck category
    let flashcards: any[] = [];
    if (match.deck_category_id) {
      const { data: cards, error: cardsError } = await supabase
        .from('flashcards')
        .select('id, front, back')
        .eq('category_id', match.deck_category_id);

      if (cardsError) {
        console.error('Flashcards fetch error:', cardsError?.message);
        return new Response(JSON.stringify({ error: 'Failed to fetch flashcards for the selected deck.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      flashcards = cards;
    } else {
      return new Response(JSON.stringify({ error: 'A flashcard category must be selected to start the game.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (flashcards.length < match.total_rounds) {
      return new Response(JSON.stringify({ error: `Not enough flashcards in the selected deck (${flashcards.length}) for ${match.total_rounds} rounds.` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Shuffle and select cards for the game (ensure unique cards per round)
    const shuffledCards = flashcards.sort(() => Math.random() - 0.5);
    const selectedCardsForGame = shuffledCards.slice(0, match.total_rounds);

    // 4. Create all rounds for the match
    const roundsToInsert = selectedCardsForGame.map((card, index) => ({
      match_id: match.id,
      round_number: index + 1,
      card_id: card.id,
      question: card.front,
      correct_answer: card.back,
      start_time: index === 0 ? new Date().toISOString() : null, // Only set start_time for the first round
    }));

    const { data: insertedRounds, error: insertRoundsError } = await supabase
      .from('flash_match_rounds')
      .insert(roundsToInsert)
      .select();

    if (insertRoundsError || !insertedRounds) {
      console.error('Error creating all rounds:', insertRoundsError?.message);
      return new Response(JSON.stringify({ error: 'Failed to create game rounds.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // 5. Update match status to 'in_progress' and set current_round_number to 1
    const { data: updatedMatch, error: updateMatchError } = await supabase
      .from('flash_matches')
      .update({
        status: 'in_progress',
        current_round_number: 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', match_id)
      .select()
      .single();

    if (updateMatchError || !updatedMatch) {
      console.error('Error updating match status:', updateMatchError?.message);
      return new Response(JSON.stringify({ error: 'Failed to update match status.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Match started successfully', match: updatedMatch, rounds: insertedRounds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in start-flash-match function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});