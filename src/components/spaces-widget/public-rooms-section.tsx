"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogIn } from "lucide-react";
import { useCurrentRoom } from "@/hooks/use-current-room"; // Removed useRooms as it was unused
import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";

interface PublicRoomsSectionProps {
  publicRooms: RoomData[];
}

export function PublicRoomsSection({ publicRooms }: PublicRoomsSectionProps) {
  const { session, profile } = useSupabase();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const handleEnterRoom = (room: RoomData) => {
    if (!session && !room.is_public && !room.password_hash) {
      toast.error("You must be logged in to enter a private room.");
      return;
    }
    setCurrentRoom(room.id, room.name);
  };

  const getRoomCreatorName = (creatorId: string) => {
    if (session?.user?.id === creatorId) {
      return profile?.first_name || profile?.last_name || "You";
    }
    return `User (${creatorId.substring(0, 4)}...)`;
  };

  if (publicRooms.length === 0) {
    return null;
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Public Rooms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-3">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl",
                  currentRoomId === room.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex-1 pr-2">
                  <p className="font-medium text-sm">{room.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created by: {getRoomCreatorName(room.creator_id)}
                    {room.password_hash && " (Password Protected)"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEnterRoom(room)}
                  title="Enter Room"
                  disabled={currentRoomId === room.id}
                >
                  <LogIn className="h-4 w-4" />
                  <span className="sr-only">Enter Room</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}