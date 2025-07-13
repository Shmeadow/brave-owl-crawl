"use client";

import React from "react";
import { useRooms } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { MyRoomsList } from "./my-rooms-list";
import { ExploreRoomsList } from "./explore-rooms-list";
import { RoomActions } from "./room-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Spaces</h1>

        <MyRoomsList myRooms={myRooms} />

        <Separator className="w-full" />

        <Card className="w-full bg-background/50 backdrop-blur-xl border-white/20 p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-xl">Join or Explore Rooms</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <RoomActions />
            {publicRoomsToExplore.length > 0 && (
              <>
                <Separator />
                <ExploreRoomsList publicRooms={publicRoomsToExplore} />
              </>
            )}
          </CardContent>
        </Card>

        {!session && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Log in to create your own rooms and manage their members.
          </p>
        )}
      </div>
    </div>
  );
}