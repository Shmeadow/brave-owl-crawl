"use client";

import React from "react";
import { useRooms } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { RoomOwnerControlsSection } from "@/components/spaces-widget/room-owner-controls-section";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function MyRoomSettingsWidget() {
  const { session } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms();

  const myRoom = rooms.find(room => room.creator_id === session?.user?.id && !room.deleted_at);

  if (roomsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!myRoom) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        You do not own a room. Please create one in the "Spaces" widget.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        <RoomOwnerControlsSection room={myRoom} />
      </div>
    </ScrollArea>
  );
}