"use client";

import React from "react";
import { useRooms, useCurrentRoom } from "@/hooks";
import { useSupabase } from "@/integrations/supabase/auth";
import { CreateRoomSection, MyRoomsSection, JoinRoomSection, PublicRoomsSection, RoomOwnerControlsSection } from "@/components/spaces-widget";

export function SpacesWidget() {
  const { session, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms();
  const { currentRoomId } = useCurrentRoom();

  const currentRoom = rooms.find(room => room.id === currentRoomId);
  const isOwnerOfCurrentRoom = currentRoom && session?.user?.id === currentRoom.creator_id;

  if (authLoading || roomsLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading rooms...</p>
      </div>
    );
  }

  const myCreatedRooms = rooms.filter(room => room.creator_id === session?.user?.id);
  const myJoinedRooms = rooms.filter(room => room.is_member && room.creator_id !== session?.user?.id);
  const publicRooms = rooms.filter(room => room.is_public && room.creator_id !== session?.user?.id && !room.is_member);

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Explore & Manage Rooms</h1>

        {session && <CreateRoomSection />}

        {session && (myCreatedRooms.length > 0 || myJoinedRooms.length > 0) && (
          <MyRoomsSection
            myCreatedRooms={myCreatedRooms}
            myJoinedRooms={myJoinedRooms}
          />
        )}

        {session && <JoinRoomSection />}

        {publicRooms.length > 0 && (
          <PublicRoomsSection publicRooms={publicRooms} />
        )}

        {isOwnerOfCurrentRoom && currentRoomId && currentRoom && (
          <RoomOwnerControlsSection
            currentRoom={currentRoom}
            isOwnerOfCurrentRoom={isOwnerOfCurrentRoom}
          />
        )}

        {!session && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Log in to create your own rooms, manage their privacy settings, and join private rooms via invite codes.
          </p>
        )}
      </div>
    </div>
  );
}