"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Send } from "lucide-react"; // Added Send icon
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export function JoinRoomSection() {
  const { session } = useSupabase();
  const { handleJoinRoomByCode, handleJoinRoomByPassword, handleSendJoinRequest } = useRooms(); // Added handleSendJoinRequest
  const { currentRoomId } = useCurrentRoom();

  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinPasswordInput, setJoinPasswordInput] = useState("");
  const [joinRoomIdInput, setJoinRoomIdInput] = useState(""); // New state for Room ID

  const handleJoinCodeSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!inviteCodeInput.trim()) {
      toast.error("Please enter an invite code.");
      return;
    }
    await handleJoinRoomByCode(inviteCodeInput.trim());
    setInviteCodeInput("");
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

  const handleSendJoinRequestSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to send a join request.");
      return;
    }
    if (!joinRoomIdInput.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }
    await handleSendJoinRequest(joinRoomIdInput.trim());
    setJoinRoomIdInput("");
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Join Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-code">Invite Code</Label>
          <Input
            id="invite-code"
            placeholder="Enter invite code"
            value={inviteCodeInput}
            onChange={(e) => setInviteCodeInput(e.target.value)}
            disabled={!session}
          />
        </div>
        <Button onClick={handleJoinCodeSubmit} className="w-full" disabled={!session}>
          <LogIn className="mr-2 h-4 w-4" /> Join by Code
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
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="join-room-id">Room ID</Label>
          <Input
            id="join-room-id"
            placeholder="Enter Room ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
            value={joinRoomIdInput}
            onChange={(e) => setJoinRoomIdInput(e.target.value)}
            disabled={!session}
          />
        </div>
        <Button onClick={handleSendJoinRequestSubmit} className="w-full" disabled={!session}>
          <Send className="mr-2 h-4 w-4" /> Send Join Request
        </Button>
      </CardContent>
    </Card>
  );
}