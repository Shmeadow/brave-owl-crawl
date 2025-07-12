"use client";

import React from "react";
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { CreateRoomSection } from "@/components/spaces-widget/create-room-section";
import { JoinRoomSection } from "@/components/spaces-widget/join-room-section";
import { RoomOwnerControlsSection } from "@/components/spaces-widget/room-owner-controls-section";
import { RoomListItem } from "@/components/spaces-widget/room-list-item";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpacesWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function SpacesWidget({ isCurrentRoomWritable }: SpacesWidgetProps) {
  const { session, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading, handleLeaveRoom } = useRooms();
  const { setCurrentRoom } = useCurrentRoom();

  const myCreatedRooms = rooms.filter(room => room.creator_id === session?.user?.id && !room.deleted_at);
  const myJoinedRooms = rooms.filter(room => room.is_member && room.creator_id !== session?.user?.id && !room.deleted_at);
  const publicRooms = rooms.filter(room => room.type === 'public' && !room.is_member && room.creator_id !== session?.user?.id && !room.deleted_at);

  const userOwnsRoom = myCreatedRooms.length > 0;
  const usersOwnedRoom = myCreatedRooms.length > 0 ? myCreatedRooms[0] : null;

  if (authLoading || roomsLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-foreground">Loading rooms...</p>
      </div>
    );
  }

  const handleEnterRoom = (room: any) => {
    setCurrentRoom(room.id, room.name);
  };

  return (
    <div className="h-full w-full overflow-hidden flex flex-col p-4">
      <h1 className="text-3xl font-bold text-foreground text-center mb-4">Your Spaces</h1>
      <Tabs defaultValue="my-room" className="w-full flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my-room">My Room</TabsTrigger>
          <TabsTrigger value="joined">Joined</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="join-invite">Join/Invite</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-4">
          <div className="p-1">
            <TabsContent value="my-room">
              {session ? (
                userOwnsRoom && usersOwnedRoom ? (
                  <RoomOwnerControlsSection room={usersOwnedRoom} />
                ) : (
                  <CreateRoomSection userOwnsRoom={userOwnsRoom} />
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">Log in to create and manage your own room.</p>
              )}
            </TabsContent>

            <TabsContent value="joined">
              {session ? (
                myJoinedRooms.length > 0 ? (
                  <div className="space-y-3">
                    {myJoinedRooms.map(room => (
                      <RoomListItem key={room.id} room={room} onEnter={handleEnterRoom} onLeave={handleLeaveRoom} isJoined={true} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center p-4">You haven't joined any rooms yet.</p>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">Log in to see rooms you've joined.</p>
              )}
            </TabsContent>

            <TabsContent value="discover">
              {publicRooms.length > 0 ? (
                <div className="space-y-3">
                  {publicRooms.map(room => (
                    <RoomListItem key={room.id} room={room} onEnter={handleEnterRoom} isJoined={false} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center p-4">No public rooms available right now.</p>
              )}
            </TabsContent>

            <TabsContent value="join-invite">
              <JoinRoomSection />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}