"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, RoomInvitationData } from "@/hooks/use-notifications";
import { useRooms } from "@/hooks/use-rooms";
import { cn } from "@/lib/utils";

interface RoomInvitationsListProps {
  invitations: RoomInvitationData[];
}

export function RoomInvitationsList({ invitations }: RoomInvitationsListProps) {
  const { handleAcceptInvitation, handleRejectInvitation } = useRooms();

  if (invitations.length === 0) {
    return (
      <p className="p-2 text-sm text-muted-foreground text-center">No pending room invitations.</p>
    );
  }

  return (
    <ScrollArea className="h-48">
      <div className="p-2 space-y-2">
        {invitations.map((invitation) => {
          const senderName = invitation.profiles?.first_name || invitation.profiles?.last_name || `User (${invitation.sender_id.substring(0, 8)}...)`;
          const roomName = invitation.rooms?.name || `Room (${invitation.room_id.substring(0, 8)}...)`;

          return (
            <div key={invitation.id} className="flex flex-col p-3 border rounded-md bg-muted/50">
              <p className="text-sm font-medium mb-1">
                <UserPlus className="inline-block h-4 w-4 mr-1 text-primary" />
                Invitation from <span className="font-semibold">{senderName}</span> to join <span className="font-semibold">{roomName}</span>.
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Received: {new Date(invitation.created_at).toLocaleString()}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleAcceptInvitation(invitation.id, invitation.room_id, roomName, invitation.sender_id)}
                >
                  <Check className="mr-2 h-4 w-4" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRejectInvitation(invitation.id, roomName, invitation.sender_id)}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}