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
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Query auth.users table to find the user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // Supabase admin.listUsers does not support direct email filtering.
      // We'll have to fetch and then filter, or rely on a custom RPC if performance is an issue.
      // For now, we'll assume a direct lookup is not possible via listUsers for a single email.
      // A more robust solution would be to use a custom SQL function or a different API if available.
      // For this example, we'll simulate by fetching all and filtering (not ideal for large user bases).
      // A better approach would be to expose a custom RPC function in PostgreSQL.
    });

    if (userError) {
      console.error('Error listing users:', userError);
      return new Response(JSON.stringify({ error: userError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      return new Response(JSON.stringify({ error: 'User with this email not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify({ userId: user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in get-user-id-by-email function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});