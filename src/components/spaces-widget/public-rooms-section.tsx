"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogIn } from "lucide-react";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PublicRoomsSectionProps {
  publicRooms: RoomData[];
}

export function PublicRoomsSection({ publicRooms }: PublicRoomsSectionProps) {
  const { session } = useSupabase();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const handleEnterRoom = (room: RoomData) => {
    if (!session && !room.is_public && !room.password_hash) {
      // This check is mostly for consistency, public rooms shouldn't have password_hash
      toast.error("You must be logged in to enter a private room.");
      return;
    }
    setCurrentRoom(room.id, room.name);
  };

  const getRoomCreatorName = (room: RoomData) => {
    if (session?.user?.id === room.creator_id) {
      return "You";
    }
    if (room.creator) {
      const name = [room.creator.first_name, room.creator.last_name].filter(Boolean).join(' ');
      return name || `User (${room.creator_id.substring(0, 4)}...)`;
    }
    return `User (${room.creator_id.substring(0, 4)}...)`;
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
                <div className="flex items-center flex-1 min-w-0">
                  <div className="relative w-16 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0 bg-muted">
                    {room.background_url && (
                      room.is_video_background ? (
                        <video src={room.background_url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <img src={room.background_url} alt={room.name} className="w-full h-full object-cover" />
                      )
                    )}
                  </div>
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-sm">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created by: {getRoomCreatorName(room)}
                      {room.password_hash && " (Password Protected)"}
                    </p>
                  </div>
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