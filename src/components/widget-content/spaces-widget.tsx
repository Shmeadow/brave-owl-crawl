"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Lock, Unlock, Trash2, LogIn } from "lucide-react";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function SpacesWidget() {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading, handleCreateRoom, handleToggleRoomPublicStatus, handleDeleteRoom } = useRooms();
  const { currentRoomId, currentRoomName, setCurrentRoom } = useCurrentRoom();

  const [newRoomName, setNewRoomName] = useState("");
  const [isNewRoomPublic, setIsNewRoomPublic] = useState(false);

  const handleCreateNewRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error("Room name cannot be empty.");
      return;
    }
    await handleCreateRoom(newRoomName.trim(), isNewRoomPublic);
    setNewRoomName("");
    setIsNewRoomPublic(false);
  };

  const handleEnterRoom = (room: RoomData) => {
    if (!session && !room.is_public) {
      toast.error("You must be logged in to enter a private room.");
      return;
    }
    setCurrentRoom(room.id, room.name);
  };

  const getRoomCreatorName = (creatorId: string) => {
    // In a real app, you'd fetch creator profiles. For now, use a placeholder.
    if (session?.user?.id === creatorId) {
      return profile?.first_name || profile?.last_name || "You";
    }
    return `User (${creatorId.substring(0, 4)}...)`;
  };

  if (authLoading || roomsLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading rooms...</p>
      </div>
    );
  }

  const myRooms = rooms.filter(room => room.creator_id === session?.user?.id);
  const publicRooms = rooms.filter(room => room.is_public && room.creator_id !== session?.user?.id);

  return (
    <div className="h-full w-full overflow-y-auto p-4"> {/* Added padding and overflow */}
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Explore & Manage Rooms</h1>

        {session && (
          <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20 p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Create New Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-room-name">Room Name</Label>
                <Input
                  id="new-room-name"
                  placeholder="e.g., Cozy Study Nook"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-room-public">Make Public</Label>
                <Switch
                  id="new-room-public"
                  checked={isNewRoomPublic}
                  onCheckedChange={setIsNewRoomPublic}
                />
              </div>
              <Button onClick={handleCreateNewRoom} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Room
              </Button>
            </CardContent>
          </Card>
        )}

        {session && myRooms.length > 0 && (
          <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20 p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">My Rooms</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-3">
                  {myRooms.map((room) => (
                    <div
                      key={room.id}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-md bg-muted/20 backdrop-blur-md",
                        currentRoomId === room.id && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-sm">{room.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {room.is_public ? "Public" : "Private"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleRoomPublicStatus(room.id, room.is_public)}
                          title={room.is_public ? "Make Private" : "Make Public"}
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
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Room</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {publicRooms.length > 0 && (
          <Card className="w-full bg-card/40 backdrop-blur-xl border-white/20 p-4">
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
                        "flex items-center justify-between p-3 border rounded-md bg-muted/20 backdrop-blur-md",
                        currentRoomId === room.id && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-sm">{room.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created by: {getRoomCreatorName(room.creator_id)}
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
        )}

        {!session && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Log in to create your own rooms and manage their privacy settings.
          </p>
        )}
      </div>
    </div>
  );
}