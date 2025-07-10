"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoomManagement } from "@/hooks/rooms/use-room-management";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface InviteUserDialogProps {
  roomId: string;
  roomName: string;
}

export function InviteUserDialog({ roomId, roomName }: InviteUserDialogProps) {
  const [inviteeInput, setInviteeInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { handleSendRoomInvitation } = useRoomManagement({
    setRooms: () => {}, // Placeholder, not used in this component
    fetchRooms: async () => {}, // Placeholder, not used in this component
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeInput.trim()) {
      toast.error("Please enter an email or user ID.");
      return;
    }

    await handleSendRoomInvitation(roomId, inviteeInput.trim());
    setInviteeInput("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Invite User">
          <UserPlus className="h-4 w-4" />
          <span className="sr-only">Invite User</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>Invite to {roomName}</DialogTitle>
          <DialogDescription>
            Enter the email address or User ID of the person you want to invite.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invitee" className="text-right">
              Email or ID
            </Label>
            <Input
              id="invitee"
              value={inviteeInput}
              onChange={(e) => setInviteeInput(e.target.value)}
              className="col-span-3 bg-muted/50 border-white/20"
              placeholder="user@example.com or a UUID"
            />
          </div>
          <Button type="submit" className="w-full">Send Invitation</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}