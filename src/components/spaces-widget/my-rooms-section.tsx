"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Unlock, Trash2, LogIn, Share2, LogOut, DoorOpen, Copy } from "lucide-react"; // Added Copy
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MyRoomsSectionProps {
  myCreatedRooms: RoomData[];
  myJoinedRooms: RoomData[];
}

export function MyRoomsSection({ myCreatedRooms, myJoinedRooms }: MyRoomsSectionProps) {
  const { session, supabase } = useSupabase();
  const {
    handleToggleRoomPublicStatus,
    handleLeaveRoom,
    handleDeleteRoom,
  } = useRooms();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const [roomInviteCodes, setRoomInviteCodes] = useState<{ [roomId: string]: string | null }>({});

  // Fetch invite codes for created rooms
  useEffect(() => {
    const fetchInviteCodes = async () => {
      if (!supabase || !session?.user?.id || myCreatedRooms.length === 0) {
        setRoomInviteCodes({});
        return;
      }

      const roomIds = myCreatedRooms.map(room => room.id);
      const { data, error } = await supabase
        .from('room_invites')
        .select('room_id, code')
        .in('room_id', roomIds)
        .eq('creator_id', session.user.id)
        .is('expires_at', null); // Only active invites

      if (error) {
        console.error("Error fetching invite codes:", error);
        toast.error("Failed to load some invite codes.");
        setRoomInviteCodes({});
      } else {
        const codesMap = data.reduce((acc, invite) => {
          acc[invite.room_id] = invite.code;
          return acc;
        }, {} as { [roomId: string]: string });
        setRoomInviteCodes(codesMap);
      }
    };

    fetchInviteCodes();
  }, [myCreatedRooms, supabase, session]); // Re-fetch when myCreatedRooms or session/supabase changes

  const handleEnterRoom = (room: RoomData) => {
    if (!session && !room.is_public && !room.password_hash) {
      toast.error("You must be logged in to enter a private room.");
      return;
    }
    setCurrentRoom(room.id, room.name);
  };

  const handleExitRoom = () => {
    setCurrentRoom(null, "My Room"); // Set current room to null for personal/guest space
    toast.info("You have exited the room and returned to your personal space.");
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Invite code copied to clipboard!");
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

  if (myCreatedRooms.length === 0 && myJoinedRooms.length === 0) {
    return null;
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">My Rooms & Joined Rooms</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-3">
            {/* "My Room" / Exit Room option */}
            {currentRoomId && (
              <div
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl",
                  !currentRoomId && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="relative w-16 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0 bg-muted flex items-center justify-center text-muted-foreground">
                    <DoorOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1 pr-2 mb-2 sm:mb-0">
                    <p className="font-medium text-sm">My Personal Space</p>
                    <p className="text-xs text-muted-foreground">Private workspace</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 sm:ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExitRoom}
                    title="Exit Current Room"
                    disabled={!currentRoomId}
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="sr-only">Exit Room</span>
                  </Button>
                </div>
              </div>
            )}

            {myCreatedRooms.map((room) => (
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
                        <img src={room.background_url} alt={room.name} className="w-full h-full object-cover" />
                      )
                    )}
                  </div>
                  <div className="flex-1 pr-2 mb-2 sm:mb-0">
                    <p className="font-medium text-sm">{room.name} (Created by You)</p>
                    <p className="text-xs text-muted-foreground">
                      {room.is_public ? "Public" : "Private"}
                      {room.password_hash && " (Password Protected)"}
                    </p>
                    {roomInviteCodes[room.id] && ( // Display invite code if available
                      <div className="flex items-center mt-1">
                        <p className="text-xs text-primary">Invite Code: <span className="font-bold">{roomInviteCodes[room.id]}</span></p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 ml-1 text-muted-foreground hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); handleCopyCode(roomInviteCodes[room.id]!); }}
                          title="Copy Invite Code"
                        >
                          <Copy className="h-3 w-3" />
                          <span className="sr-only">Copy Invite Code</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 sm:ml-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleRoomPublicStatus(room.id, room.is_public)}
                    title={room.is_public ? "Make Private" : "Make Public"}
                    disabled={!session}
                  >
                    {room.is_public ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span className="sr-only">{room.is_public ? "Make Private" : "Make Public"}</span>
                  </Button>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-100 hover:text-red-600"
                    onClick={() => handleDeleteRoom(room.id)}
                    title="Delete Room"
                    disabled={!session}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Room</span>
                  </Button>
                </div>
              </div>
            ))}
            {myJoinedRooms.map((room) => (
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
                        <img src={room.background_url} alt={room.name} className="w-full h-full object-cover" />
                      )
                    )}
                  </div>
                  <div className="flex-1 pr-2">
                    <p className="font-medium text-sm">{room.name} (Joined)</p>
                    <p className="text-xs text-muted-foreground">
                      Created by: {getRoomCreatorName(room)}
                    </p>
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-red-100 hover:text-red-600"
                    onClick={() => handleLeaveRoom(room.id)}
                    title="Leave Room"
                    disabled={!session}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Leave Room</span>
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