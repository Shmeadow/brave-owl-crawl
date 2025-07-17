"use client";

import React from "react";
import { useRooms } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MyRoomsList } from "../spaces-widget/my-rooms-list";
import { ExploreRoomsList } from "../spaces-widget/explore-rooms-list";
import { RoomActions } from "../spaces-widget/room-actions";

interface SpacesWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function SpacesWidget({ isCurrentRoomWritable }: SpacesWidgetProps) {
  const { session, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms();

  if (authLoading || roomsLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-foreground">Loading rooms...</p>
      </div>
    );
  }

  const myRooms = rooms.filter(room => room.is_member || room.creator_id === session?.user?.id);
  const publicRoomsToExplore = rooms.filter(room => room.type === 'public' && !room.is_member && room.creator_id !== session?.user?.id);

  return (
    <div className="h-full w-full overflow-y-auto p-2 sm:p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-2 sm:py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Spaces</h1>

        <RoomActions />

        <Separator className="w-full" />

        <MyRoomsList myRooms={myRooms} />

        {publicRoomsToExplore.length > 0 && (
          <>
            <Separator className="w-full" />
            <ExploreRoomsList publicRooms={publicRoomsToExplore} />
          </>
        )}

        {!session && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Log in to create your own rooms and manage their members.
          </p>
        )}
      </div>
    </div>
  );
}