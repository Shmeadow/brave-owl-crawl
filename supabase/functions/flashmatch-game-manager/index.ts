// @ts-ignore
/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// @ts-ignore
import { startMatchHandler } from './handlers/startMatch.ts';
// @ts-ignore
import { joinMatchHandler } from './handlers/joinMatch.ts';
// @ts-ignore
import { submitAnswerHandler } from './handlers/submitAnswer.ts';
// @ts-ignore
import { passRoundHandler } from './handlers/passRound.ts';
// @ts-ignore
import { stopMatchHandler } from './handlers/stopMatch.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const supabaseAdmin: SupabaseClient = createClient(
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
      case 'start_match':
        responseData = await startMatchHandler(supabaseAdmin, userId, payload);
        break;
      case 'join_match':
        responseData = await joinMatchHandler(supabaseAdmin, userId, payload);
        break;
      case 'submit_answer':
        responseData = await submitAnswerHandler(supabaseAdmin, userId, payload);
        break;
      case 'pass_round':
        responseData = await passRoundHandler(supabaseAdmin, userId, payload);
        break;
      case 'stop_match':
        responseData = await stopMatchHandler(supabaseAdmin, userId, payload);
        break;
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