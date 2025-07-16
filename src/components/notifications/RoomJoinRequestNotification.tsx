"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, UserPlus, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoomJoinRequest } from '@/hooks/rooms/use-room-join-requests';
import { useRooms } from '@/hooks/use-rooms';
import { toast } from 'sonner';
import { useNotifications } from '@/hooks/use-notifications';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface RoomJoinRequestNotificationProps {
  request: RoomJoinRequest;
  onDismiss: (request: RoomJoinRequest) => void; // Changed to accept full RoomJoinRequest object
}

export function RoomJoinRequestNotification({ request, onDismiss }: RoomJoinRequestNotificationProps) {
  const { acceptRequest, declineRequest } = useRooms();
  const { addNotification } = useNotifications();
  const [isDismissedLocally, setIsDismissedLocally] = useState(false);
  const isMobile = useIsMobile(); // Get mobile status

  const requesterName = request.profiles?.first_name || request.profiles?.last_name || `User (${request.requester_id.substring(0, 8)}...)`;
  const roomName = request.rooms?.name || request.room_id.substring(0, 8) + '...';

  const handleAccept = async () => {
    await acceptRequest(request);
    setIsDismissedLocally(true); // Hide this notification
  };

  const handleDecline = async () => {
    await declineRequest(request);
    setIsDismissedLocally(true); // Hide this notification
  };

  const handleDismissToBell = () => {
    onDismiss(request); // Pass the full request object
    setIsDismissedLocally(true); // Hide this notification
    toast.info(`Request from ${requesterName} moved to notification bell.`);
  };

  if (isDismissedLocally) {
    return null;
  }

  return (
    <Card className={cn(
      "fixed z-[905]",
      "bg-card/80 backdrop-blur-xl border-white/20 shadow-lg rounded-lg",
      "animate-in slide-in-from-right-full duration-500 ease-out",
      isMobile ? "top-16 left-1/2 -translate-x-1/2 w-full max-w-xs" : "top-40 right-4 w-80"
    )}>
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">New Join Request</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDismissToBell} title="Dismiss to notifications">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{requesterName}</span> wants to join your room <span className="font-medium text-primary">&quot;{roomName}&quot;</span>.
        </p>
        <div className="flex gap-2 mt-2">
          <Button onClick={handleAccept} className="flex-1" size="sm">
            <Check className="mr-2 h-4 w-4" /> Accept
          </Button>
          <Button onClick={handleDecline} variant="outline" className="flex-1" size="sm">
            <X className="mr-2 h-4 w-4" /> Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}