"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useRooms } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function JoinRoomByIdHeader() {
  const { session } = useSupabase();
  const { handleSendJoinRequest } = useRooms();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");

  const handleSendRequest = async () => {
    if (!session) {
      toast.error("You must be logged in to send a join request.");
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }
    await handleSendJoinRequest(roomIdInput.trim());
    setRoomIdInput("");
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        title="Join Room by ID"
        disabled={!session}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Join Room by ID</span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] z-[1004] bg-card backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle>Send Join Request</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-id-input">Room ID</Label>
              <Input
                id="room-id-input"
                placeholder="Enter Room ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendRequest();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendRequest}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}