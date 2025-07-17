"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/integrations/supabase/auth';
import { useRooms } from '@/hooks/use-rooms';
import { useCurrentRoom } from '@/hooks/use-current-room';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  const { session, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading, handleJoinRoomByRoomId } = useRooms();
  const { setCurrentRoom } = useCurrentRoom();

  useEffect(() => {
    if (authLoading || roomsLoading || !roomId) {
      return;
    }

    const attemptJoinRoom = async () => {
      const roomToJoin = rooms.find(room => room.id === roomId);

      if (!roomToJoin) {
        toast.error("Room not found or you don't have access.");
        router.replace('/dashboard');
        return;
      }

      // Attempt to join the room. The handleJoinRoomByRoomId function
      // already contains logic to check if the user is the creator,
      // already a member, or if a password/invitation is required.
      // It will also dispatch a 'roomJoined' event on successful join.
      await handleJoinRoomByRoomId(roomId);

      // After the join attempt (successful or not, handled by toasts in the hook),
      // always redirect to the dashboard. The useCurrentRoom hook will
      // ensure the correct room is set based on the 'roomJoined' event.
      router.replace('/dashboard');
    };

    attemptJoinRoom();
  }, [roomId, authLoading, roomsLoading, rooms, session, router, handleJoinRoomByRoomId, setCurrentRoom]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Joining room...</p>
      </div>
    </div>
  );
}