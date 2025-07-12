"use client";

import React from "react";
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { CreateRoomSection } from "@/components/spaces-widget/create-room-section";
import { MyRoomsSection } from "@/components/spaces-widget/my-rooms-section";
import { JoinRoomSection } from "@/components/spaces-widget/join-room-section";
import { PublicRoomsSection } from "@/components/spaces-widget/public-rooms-section";
import { RoomOwnerControlsSection } from "@/components/spaces-widget/room-owner-controls-section";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface SpacesWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function SpacesWidget({ isCurrentRoomWritable }: SpacesWidgetProps) {
  const { session, loading: authLoading, profile } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms();
  const { currentRoomId } = useCurrentRoom();

  // Find the user's primary owned room (personal room)
  const usersPersonalRoom = rooms.find(room => room.id === profile?.personal_room_id && room.creator_id === session?.user?.id && !room.deleted_at);
  
  // Filter other created rooms (not the personal room)
  const otherCreatedRooms = rooms.filter(room => 
    room.creator_id === session?.user?.id && 
    !room.deleted_at && 
    room.id !== usersPersonalRoom?.id
  );

  const myJoinedRooms = rooms.filter(room => room.is_member && room.creator_id !== session?.user?.id && !room.deleted_at);
  const publicRooms = rooms.filter(room => room.type === 'public' && !room.is_member && room.creator_id !== session?.user?.id && !room.deleted_at);

  if (authLoading || roomsLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-foreground">Loading rooms...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Your Spaces</h1>

        {session ? (
          <>
            {usersPersonalRoom ? (
              <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Your Personal Room: {usersPersonalRoom.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RoomOwnerControlsSection room={usersPersonalRoom} />
                </CardContent>
              </Card>
            ) : (
              <CreateRoomSection userOwnsRoom={false} />
            )}

            {(otherCreatedRooms.length > 0 || myJoinedRooms.length > 0) && (
              <>
                <Separator className="w-full" />
                <MyRoomsSection
                  myCreatedRooms={otherCreatedRooms}
                  myJoinedRooms={myJoinedRooms}
                />
              </>
            )}

            <Separator className="w-full" />
            <JoinRoomSection />
          </>
        ) : (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Log in to create your own rooms and manage their members.
          </p>
        )}

        {publicRooms.length > 0 && (
          <>
            <Separator className="w-full" />
            <PublicRoomsSection publicRooms={publicRooms} />
          </>
        )}
      </div>
    </div>
  );
}