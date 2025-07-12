"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, LogIn, Copy, Settings } from "lucide-react";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNowStrict } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RoomSettingsContent } from "./RoomSettingsContent"; // Import the new component

interface RoomOwnerControlsSectionProps {
  room: RoomData;
}

export function RoomOwnerControlsSection({ room }: RoomOwnerControlsSectionProps) {
  const { session } = useSupabase();
  const { handleDeleteRoom } = useRooms();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const isOwnerOfCurrentRoom = room.creator_id === session?.user?.id;
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState(false);

  const handleEnterRoom = (room: RoomData) => {
    setCurrentRoom(room.id, room.name);
  };

  const handleCopyRoomId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Room ID copied to clipboard!");
  };

  if (!isOwnerOfCurrentRoom) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl",
          currentRoomId === room.id && "ring-2 ring-primary"
        )}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className="relative w-16 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0 bg-muted">
            {room.background_url && (
              room.is_video_background ? (
                <video src={room.background_url} className="w-full h-full object-cover" muted playsInline />
              ) : (
                <Image src={room.background_url} alt={room.name} fill className="object-cover" sizes="64px" priority={false} />
              )
            )}
          </div>
          <div className="flex-1 pr-2">
            <p className="font-medium text-sm">{room.name}</p>
            {room.description && <p className="text-xs text-muted-foreground line-clamp-1">{room.description}</p>}
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {room.type === 'public' ? 'Public Room' : 'Private Room'}
              {room.type === 'private' && room.password_hash && ' (Password Protected)'}
            </p>
            {room.closes_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Closes in: {formatDistanceToNowStrict(new Date(room.closes_at))}
              </p>
            )}
            <div className="flex items-center mt-1">
              <p className="text-xs text-primary">Room ID: <span className="font-bold">{room.id.substring(0, 8)}...</span></p>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 text-primary hover:bg-primary/10"
                onClick={(e) => { e.stopPropagation(); handleCopyRoomId(room.id); }}
                title="Copy Room ID"
              >
                <Copy className="h-3 w-3" />
                <span className="sr-only">Copy Room ID</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 sm:ml-auto">
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
          <Popover open={isSettingsPopoverOpen} onOpenChange={setIsSettingsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Room Settings"
                onClick={(e) => e.stopPropagation()} // Prevent default behavior if any
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Room Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-96 z-[1100] p-0 bg-popover/80 backdrop-blur-lg border-white/20"
              align="end"
              onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus trap issues
            >
              <RoomSettingsContent room={room} />
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:bg-red-100 hover:text-red-600"
            onClick={() => handleDeleteRoom(room.id)}
            title="Close Room"
            disabled={!session}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Close Room</span>
          </Button>
        </div>
      </div>
    </div>
  );
}