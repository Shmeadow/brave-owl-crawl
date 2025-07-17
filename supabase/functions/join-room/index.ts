/// <reference lib="deno.ns" />
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
    const { roomId, passwordAttempt } = await req.json();
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
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Use service role key for RLS bypass
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

    // 1. Fetch room details
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id, creator_id, name, type, password_hash')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      console.error('Room fetch error:', roomError?.message);
      return new Response(JSON.stringify({ error: 'Room not found or access denied' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 2. Check if already a member or creator
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', roomId)
      .eq('user_id', caller_id)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error checking existing membership:', memberCheckError);
        return new Response(JSON.stringify({ error: 'Failed to check membership status.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    if (room.creator_id === caller_id || existingMember) {
      return new Response(JSON.stringify({ message: 'Already a member or creator of this room.', roomName: room.name, status: 'already_joined' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Handle join logic based on room type
    if (room.type === 'private') {
      if (room.password_hash) {
        // Private room with password
        if (!passwordAttempt) {
          return new Response(JSON.stringify({ error: 'This private room requires a password.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
        const { data: passwordMatch, error: rpcError } = await supabase.rpc('check_password', {
          _password_attempt: passwordAttempt,
          _password_hash: room.password_hash,
        });

        if (rpcError) {
          console.error('Password checking error:', rpcError);
          return new Response(JSON.stringify({ error: 'An error occurred while verifying password.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        if (!passwordMatch) {
          return new Response(JSON.stringify({ error: 'Incorrect password.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          });
        }
      } else {
        // Private room without password (invite-only)
        const { data: invitation, error: inviteError } = await supabase
          .from('room_invitations')
          .select('id')
          .eq('room_id', roomId)
          .eq('receiver_id', caller_id)
          .eq('status', 'pending')
          .single();

        if (inviteError && inviteError.code !== 'PGRST116') {
          console.error('Error checking invitation:', inviteError);
          return new Response(JSON.stringify({ error: 'Failed to check for invitation.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
        if (!invitation) {
          // If no invitation, send a join request instead of direct join
          const { data: existingRequest, error: checkRequestError } = await supabase
            .from('room_join_requests')
            .select('id')
            .eq('room_id', roomId)
            .eq('requester_id', caller_id)
            .in('status', ['pending', 'accepted']);

          if (checkRequestError) {
            console.error("Error checking existing join request:", checkRequestError);
            return new Response(JSON.stringify({ error: 'Failed to check for existing join request.' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            });
          }

          if (existingRequest && existingRequest.length > 0) {
            return new Response(JSON.stringify({ message: 'You already have a pending join request for this room.', roomName: room.name, status: 'pending_request' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            });
          }

          const { error: requestError } = await supabase
            .from('room_join_requests')
            .insert({ room_id: roomId, requester_id: caller_id, status: 'pending' });

          if (requestError) {
            console.error("Error creating join request:", requestError);
            return new Response(JSON.stringify({ error: 'Failed to send join request: ' + requestError.message }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500,
            });
          }
          return new Response(JSON.stringify({ message: 'Join request sent to room owner.', roomName: room.name, status: 'request_sent' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }
        // If invitation exists, proceed to insert member and update invitation status
        const { error: updateInviteError } = await supabase
          .from('room_invitations')
          .update({ status: 'accepted' })
          .eq('id', invitation.id);
        if (updateInviteError) {
          console.error('Error updating invitation status:', updateInviteError);
          // Don't block join, but log error
        }
      }
    }

    // 4. Insert member into room_members (if not already handled by request_sent status)
    const { error: insertMemberError } = await supabase
      .from('room_members')
      .insert({ room_id: roomId, user_id: caller_id });

    if (insertMemberError) {
      console.error('Error inserting room member:', insertMemberError);
      return new Response(JSON.stringify({ error: insertMemberError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Successfully joined room.', roomName: room.name, status: 'joined' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in join-room function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});