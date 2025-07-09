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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

export function JoinRoomSection() {
  const { session } = useSupabase();
  const { handleSendRoomInvitation, rooms } = useRooms(); // Get rooms to filter for owned rooms
  const { currentRoomId } = useCurrentRoom();

  const myCreatedRooms = rooms.filter(room => room.creator_id === session?.user?.id);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(myCreatedRooms.length > 0 ? myCreatedRooms[0].id : null); // Use select for room ID
  const [receiverEmail, setReceiverEmail] = useState(""); // Changed to email

  const handleSendInvitationSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to send invitations.");
      return;
    }
    if (!selectedRoomId) {
      toast.error("Please select a room you own to send an invitation from.");
      return;
    }
    if (!receiverEmail.trim()) {
      toast.error("Please enter the recipient's Email Address.");
      return;
    }
    await handleSendRoomInvitation(selectedRoomId, receiverEmail.trim());
    setReceiverEmail("");
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Send Room Invitation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="room-select-input">Select Your Room</Label>
          <Select
            value={selectedRoomId || ""}
            onValueChange={(value) => setSelectedRoomId(value)}
            disabled={!session || myCreatedRooms.length === 0}
          >
            <SelectTrigger id="room-select-input">
              <SelectValue placeholder="Select a room you own" />
            </SelectTrigger>
            <SelectContent>
              {myCreatedRooms.length === 0 && (
                <SelectItem value="" disabled>No rooms created by you</SelectItem>
              )}
              {myCreatedRooms.map(room => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {myCreatedRooms.length === 0 && (
            <p className="text-sm text-muted-foreground">You need to create a room first to send invitations.</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiver-email-input">Recipient Email Address</Label>
          <Input
            id="receiver-email-input"
            type="email"
            placeholder="Enter recipient's email"
            value={receiverEmail}
            onChange={(e) => setReceiverEmail(e.target.value)}
            disabled={!session || !selectedRoomId}
          />
        </div>
        <Button onClick={handleSendInvitationSubmit} className="w-full" disabled={!session || !selectedRoomId}>
          <Send className="mr-2 h-4 w-4" /> Send Invitation
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Send an invitation to another user by providing their email address.
        </p>
      </CardContent>
    </Card>
  );
}