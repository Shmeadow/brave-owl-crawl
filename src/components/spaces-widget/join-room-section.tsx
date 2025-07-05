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
  const { handleJoinRoomByRoomId, handleJoinRoomByPassword } = useRooms();
  const { currentRoomId } = useCurrentRoom();

  const [roomIdInput, setRoomIdInput] = useState(""); // Changed from inviteCodeInput
  const [joinPasswordInput, setJoinPasswordInput] = useState("");

  const handleJoinRoomIdSubmit = async () => { // Changed function name
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Room ID."); // Changed error message
      return;
    }
    await handleJoinRoomByRoomId(roomIdInput.trim()); // Changed function call
    setRoomIdInput("");
  };

  const handleJoinPasswordSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!joinPasswordInput.trim()) {
      toast.error("Please enter the room password.");
      return;
    }
    if (currentRoomId) {
      await handleJoinRoomByPassword(currentRoomId, joinPasswordInput.trim());
      setJoinPasswordInput("");
    } else {
      toast.error("Please select a room to join by password.");
    }
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Join Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room-id-input">Room ID</Label> {/* Changed label */}
          <Input
            id="room-id-input" // Changed id
            placeholder="Enter Room ID" // Changed placeholder
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            disabled={!session}
          />
        </div>
        <Button onClick={handleJoinRoomIdSubmit} className="w-full" disabled={!session}> {/* Changed function call */}
          <LogIn className="mr-2 h-4 w-4" /> Join by Room ID {/* Changed button text */}
        </Button>
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="join-password">Room Password</Label>
          <Input
            id="join-password"
            type="password"
            placeholder="Enter room password"
            value={joinPasswordInput}
            onChange={(e) => setJoinPasswordInput(e.target.value)}
            disabled={!session || !currentRoomId}
          />
        </div>
        <Button onClick={handleJoinPasswordSubmit} className="w-full" disabled={!session || !currentRoomId}>
          <LogIn className="mr-2 h-4 w-4" /> Join by Password
        </Button>
      </CardContent>
    </Card>
  );
}