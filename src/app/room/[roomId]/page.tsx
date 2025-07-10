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
  const { rooms, loading: roomsLoading, handleJoinRoomByRoomId, handleJoinRoomByPassword } = useRooms();
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

      // If already a member or creator, just set as current room and redirect
      if (roomToJoin.is_member || roomToJoin.creator_id === session?.user?.id) {
        setCurrentRoom(roomToJoin.id, roomToJoin.name);
        router.replace('/dashboard');
        return;
      }

      // If public, attempt to join directly
      if (roomToJoin.type === 'public') {
        await handleJoinRoomByRoomId(roomId);
        setCurrentRoom(roomToJoin.id, roomToJoin.name);
        router.replace('/dashboard');
        return;
      }

      // If private and has password, prompt for password (for now, we'll just redirect)
      // A more advanced implementation would show a password input modal here.
      if (roomToJoin.type === 'private' && roomToJoin.password_hash) {
        toast.info("This is a private room. Please join via the 'Spaces' widget with the room ID and password.");
        router.replace('/dashboard');
        return;
      }

      // If private and no password, it means it's invite-only
      if (roomToJoin.type === 'private' && !roomToJoin.password_hash) {
        toast.info("This is a private room and requires an invitation to join.");
        router.replace('/dashboard');
        return;
      }

      // Fallback for any unhandled cases
      toast.error("Could not join room. Please check room details.");
      router.replace('/dashboard');
    };

    attemptJoinRoom();
  }, [roomId, authLoading, roomsLoading, rooms, session, router, handleJoinRoomByRoomId, handleJoinRoomByPassword, setCurrentRoom]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Joining room...</p>
      </div>
    </div>
  );
}