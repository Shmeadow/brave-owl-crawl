"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, LogIn, LogOut, Copy, Globe, Lock, Clock } from "lucide-react";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNowStrict } from 'date-fns';

interface RoomListItemProps {
  room: RoomData;
}

export function RoomListItem({ room }: RoomListItemProps) {
  const { session } = useSupabase();
  const { handleLeaveRoom, handleDeleteRoom } = useRooms();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const isOwner = room.creator_id === session?.user?.id;
  const isJoined = room.is_member;

  const handleEnterRoom = () => {
    setCurrentRoom(room.id, room.name);
  };

  const handleCopyRoomId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(room.id);
    toast.success("Room ID copied to clipboard!");
  };

  const onDeleteClick = () => {
    handleDeleteRoom(room.id);
    if (currentRoomId === room.id) {
      setCurrentRoom(null, "Dashboard");
    }
  };

  const onLeaveClick = () => {
    handleLeaveRoom(room.id);
    if (currentRoomId === room.id) {
      setCurrentRoom(null, "Dashboard");
    }
  };

  const getRoomCreatorDisplay = () => {
    if (isOwner) return "Created by You";
    const profile = room.profiles?.[0];
    if (profile) {
      return `by ${profile.first_name || profile.last_name || `User (${room.creator_id.substring(0, 4)}...)`}`;
    }
    return `by User (${room.creator_id.substring(0, 4)}...)`;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-md bg-muted backdrop-blur-xl",
        currentRoomId === room.id && "ring-2 ring-primary"
      )}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="relative w-16 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0 bg-muted">
          {room.background_url ? (
            room.is_video_background ? (
              <video src={room.background_url} className="w-full h-full object-cover" muted playsInline autoPlay loop key={room.background_url} />
            ) : (
              <Image src={room.background_url} alt={room.name} fill className="object-cover" sizes="64px" priority={false} />
            )
          ) : (
            // Fallback for when there is no background_url
            <Image src="/static/bg1.jpg" alt="Default room background" fill className="object-cover" sizes="64px" priority={false} />
          )}
        </div>
        <div className="flex-1 pr-2 mb-2 sm:mb-0">
          <p className="font-medium text-sm">{room.name}</p>
          <p className="text-xs text-muted-foreground">{getRoomCreatorDisplay()}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {room.type === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            {room.type === 'public' ? 'Public' : 'Private'}
            {room.type === 'private' && room.password_hash && ' (Password Protected)'}
          </p>
          {room.closes_at && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Closes in: {formatDistanceToNowStrict(new Date(room.closes_at))}
            </p>
          )}
          <div className="flex items-center mt-1">
            <p className="text-xs text-primary">Room ID: <span className="font-bold">{room.id.substring(0, 8)}...</span></p>
            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-primary hover:bg-primary/10" onClick={handleCopyRoomId} title="Copy Room ID">
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:ml-auto">
        <Button variant="ghost" size="icon" onClick={handleEnterRoom} title="Enter Room" disabled={currentRoomId === room.id}>
          <LogIn className="h-5 w-5" />
        </Button>
        {isOwner && (
          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 hover:text-red-600" onClick={onDeleteClick} title="Close Room">
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
        {isJoined && !isOwner && (
          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-100 hover:text-red-600" onClick={onLeaveClick} title="Leave Room">
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}