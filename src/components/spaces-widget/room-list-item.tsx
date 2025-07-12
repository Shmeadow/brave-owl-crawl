"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Copy, Globe, Lock, Clock } from "lucide-react";
import { RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNowStrict } from 'date-fns';

interface RoomListItemProps {
  room: RoomData;
  onEnter: (room: RoomData) => void;
  onLeave?: (roomId: string) => void;
  isJoined: boolean;
}

export function RoomListItem({ room, onEnter, onLeave, isJoined }: RoomListItemProps) {
  const { currentRoomId } = useCurrentRoom();

  const handleCopyRoomId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    toast.success("Room ID copied to clipboard!");
  };

  const getRoomCreatorDisplay = (room: RoomData) => {
    if (room.profiles && room.profiles.length > 0) {
      return room.profiles[0].first_name || room.profiles[0].last_name || `User (${room.creator_id.substring(0, 4)}...)`;
    }
    return `User (${room.creator_id.substring(0, 4)}...)`;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-muted/50 backdrop-blur-xl",
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
            {room.type === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {room.type === 'public' ? 'Public Room' : 'Private Room'}
          </p>
          <p className="text-xs text-muted-foreground">
            Created by: {getRoomCreatorDisplay(room)}
          </p>
          {room.closes_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Closes in: {formatDistanceToNowStrict(new Date(room.closes_at))}
            </p>
          )}
          <div className="flex items-center mt-1">
            <p className="text-xs text-primary">Room ID: <span className="font-bold">{room.id.substring(0, 8)}...</span></p>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1 text-primary hover:bg-primary/10"
              onClick={(e) => handleCopyRoomId(e, room.id)}
              title="Copy Room ID"
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copy Room ID</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 sm:ml-auto mt-2 sm:mt-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEnter(room)}
          title="Enter Room"
          disabled={currentRoomId === room.id}
        >
          <LogIn className="h-4 w-4" />
          <span className="sr-only">Enter Room</span>
        </Button>
        {isJoined && onLeave && (
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:bg-red-100 hover:text-red-600"
            onClick={() => onLeave(room.id)}
            title="Leave Room"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Leave Room</span>
          </Button>
        )}
      </div>
    </div>
  );
}