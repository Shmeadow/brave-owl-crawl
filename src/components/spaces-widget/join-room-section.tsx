"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react"; // Changed icon to Send
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export function JoinRoomSection() {
  const { session } = useSupabase();
  const { handleSendRoomInvitation } = useRooms(); // Use handleSendRoomInvitation
  const { currentRoomId } = useCurrentRoom();

  const [roomIdInput, setRoomIdInput] = useState("");
  const [receiverIdInput, setReceiverIdInput] = useState("");

  const handleSendInvitationSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to send invitations.");
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }
    if (!receiverIdInput.trim()) {
      toast.error("Please enter the recipient's User ID.");
      return;
    }
    await handleSendRoomInvitation(roomIdInput.trim(), receiverIdInput.trim());
    setRoomIdInput("");
    setReceiverIdInput("");
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Send Room Invitation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room-id-input">Room ID to Invite To</Label>
          <Input
            id="room-id-input"
            placeholder="Enter Room ID"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            disabled={!session}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiver-id-input">Recipient User ID</Label>
          <Input
            id="receiver-id-input"
            placeholder="Enter User ID of recipient"
            value={receiverIdInput}
            onChange={(e) => setReceiverIdInput(e.target.value)}
            disabled={!session}
          />
        </div>
        <Button onClick={handleSendInvitationSubmit} className="w-full" disabled={!session}>
          <Send className="mr-2 h-4 w-4" /> Send Invitation
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Send an invitation to another user by providing the Room ID and their User ID.
        </p>
      </CardContent>
    </Card>
  );
}