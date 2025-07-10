"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LogIn, Copy, Globe, Clock } from "lucide-react";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNowStrict } from 'date-fns';

interface PublicRoomsSectionProps {
  publicRooms: RoomData[];
}

export function PublicRoomsSection({ publicRooms }: PublicRoomsSectionProps) {
  const { handleJoinRoomByRoomId } = useRooms();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const handleEnterRoom = async (room: RoomData) => {
    await handleJoinRoomByRoomId(room.id);
    setCurrentRoom(room.id, room.name);
  };

  const handleCopyRoomId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Room ID copied to clipboard!");
  };

  const getRoomCreatorDisplay = (room: RoomData) => {
    if (room.profiles && room.profiles.length > 0) {
      return room.profiles[0].first_name || room.profiles[0].last_name || `User (${room.creator_id.substring(0, 4)}...)`;
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
        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-3">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl",
                  currentRoomId === room.id && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="relative w-16 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0 bg-muted">
                    {room.background_url && (
                      room.is_video_background ? (
                        <video src={room.background_url} className="w-full h-full object-cover" muted playsInline />
                      ) : (
                        <Image src={room.background_url} alt={room.name} fill className="object-cover" sizes="64px" priority={false} />
                      )
                    )}
                  </div>
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-sm">{room.name}</p>
                    {room.description && <p className="text-xs text-muted-foreground line-clamp-1">{room.description}</p>}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Public Room
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created by: {getRoomCreatorDisplay(room)}
                    </p>
                    {room.closes_at && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Closes in: {formatDistanceToNowStrict(new Date(room.closes_at))}
                      </p>
                    )}
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-primary">Room ID: <span className="font-bold">{room.id.substring(0, 8)}...</span></p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 text-primary hover:bg-primary/10"
                        onClick={(e) => { e.stopPropagation(); handleCopyRoomId(room.id); }}
                        title="Copy Room ID"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="sr-only">Copy Room ID</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 sm:ml-auto">
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
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}