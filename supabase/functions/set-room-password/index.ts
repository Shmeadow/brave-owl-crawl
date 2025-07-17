import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { roomId, password } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!roomId) {
      return new Response(JSON.stringify({ error: 'Room ID is required' }), {
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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key for RLS bypass
    );

    // Get user ID from the provided JWT
    const { data: user, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user.user) {
      console.error('Auth error:', userError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const userId = user.user.id;

    // Verify room ownership
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('creator_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      console.error('Room fetch error:', roomError?.message);
      return new Response(JSON.stringify({ error: 'Room not found or access denied' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (room.creator_id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden: You are not the room creator' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    let passwordHash = null;
    if (password) {
      // Hash the password using pgcrypto's crypt function via a database function
      const { data: hashData, error: hashError } = await supabase.rpc('crypt', {
        _password: password,
        _salt: genSalt(), // Generate a new salt for each password
      });

      if (hashError) {
        console.error('Password hashing error:', hashError);
        return new Response(JSON.stringify({ error: 'Failed to hash password' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
      passwordHash = hashData;
    }

    const { error: updateError } = await supabase
      .from('rooms')
      .update({ password_hash: passwordHash })
      .eq('id', roomId);

    if (updateError) {
      console.error('Error updating room password:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: password ? 'Room password set successfully' : 'Room password removed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in set-room-password function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Helper to generate a salt for crypt()
function genSalt() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./';
  let salt = '$2a$10$'; // bcrypt prefix with 10 rounds
  for (let i = 0; i < 22; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  return salt;
}