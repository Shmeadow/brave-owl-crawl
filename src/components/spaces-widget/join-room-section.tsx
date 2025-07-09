"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export function JoinRoomSection() {
  const { session } = useSupabase();
  const { handleJoinRoomByRoomId } = useRooms(); // Only Room ID join is available
  const { currentRoomId } = useCurrentRoom(); // Keep currentRoomId for context if needed

  const [roomIdInput, setRoomIdInput] = useState("");

  const handleJoinRoomIdSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }
    await handleJoinRoomByRoomId(roomIdInput.trim());
    setRoomIdInput("");
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Join Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room-id-input">Room ID</Label>
          <Input
            id="room-id-input"
            placeholder="Enter Room ID"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            disabled={!session}
          />
        </div>
        <Button onClick={handleJoinRoomIdSubmit} className="w-full" disabled={!session}>
          <LogIn className="mr-2 h-4 w-4" /> Join Room
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Enter a Room ID to join.
        </p>
      </CardContent>
    </Card>
  );
}