"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, LogIn, LogOut, Copy, UserPlus, Lock, Globe, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useRooms, RoomData } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { SelectItem } from "@/components/ui/select";
import { formatDistanceToNowStrict } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RoomSettingsContent } from "./RoomSettingsContent"; // Import the new component

interface MyRoomsSectionProps {
  myCreatedRooms: RoomData[]; // Now explicitly "other" created rooms
  myJoinedRooms: RoomData[];
}

export function MyRoomsSection({ myCreatedRooms, myJoinedRooms }: MyRoomsSectionProps) {
  const { session } = useSupabase();
  const {
    handleSendRoomInvitation,
    handleLeaveRoom,
    handleDeleteRoom,
  } = useRooms();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [memberEmailInput, setMemberEmailInput] = useState("");
  const [selectedRoomForMember, setSelectedRoomForMember] = useState<string | null>(null);
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState<Record<string, boolean>>({}); // State for multiple popovers

  const handleEnterRoom = (room: RoomData) => {
    setCurrentRoom(room.id, room.name);
  };

  const handleCopyRoomId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Room ID copied to clipboard!");
  };

  const getRoomCreatorDisplay = (room: RoomData) => {
    const profile = room.profiles?.[0];
    if (profile) {
      return profile.first_name || profile.last_name || `User (${room.creator_id.substring(0, 4)}...)`;
    }
    return `User (${room.creator_id.substring(0, 4)}...)`;
  };

  const openAddMemberDialog = (roomId: string) => {
    setSelectedRoomForMember(roomId);
    setIsAddMemberDialogOpen(true);
  };

  const handleAddMemberSubmit = async () => {
    if (selectedRoomForMember && memberEmailInput.trim()) {
      await handleSendRoomInvitation(selectedRoomForMember, memberEmailInput.trim());
      setMemberEmailInput("");
      setIsAddMemberDialogOpen(false);
    } else {
      toast.error("Please enter a valid Email Address.");
    }
  };

  if (myCreatedRooms.length === 0 && myJoinedRooms.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="w-full bg-background/50 backdrop-blur-xl border-white/20 p-4">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Your Rooms</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-3">
              {myCreatedRooms.map((room) => (
                <div key={room.id}> {/* Wrap in a div for consistent styling */}
                  <div
                    className={cn(
                      "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl",
                      currentRoomId === room.id && "ring-2 ring-primary",
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
                      <div className="flex-1 pr-2 mb-2 sm:mb-0">
                        <p className="font-medium text-sm">{room.name} (Created by You)</p>
                        {room.description && <p className="text-xs text-muted-foreground line-clamp-1">{room.description}</p>}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          {room.type === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {room.type === 'public' ? 'Public Room' : 'Private Room'}
                          {room.type === 'private' && room.password_hash && ' (Password Protected)'}
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
                        onClick={(e) => { e.stopPropagation(); openAddMemberDialog(room.id); }}
                        title="Add Member"
                        disabled={!session}
                      >
                        <UserPlus className="h-4 w-4" />
                        <span className="sr-only">Add Member</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleEnterRoom(room); }}
                        title="Enter Room"
                        disabled={currentRoomId === room.id}
                      >
                        <LogIn className="h-4 w-4" />
                        <span className="sr-only">Enter Room</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                        title="Close Room"
                        disabled={!session}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Close Room</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {myJoinedRooms.map((room) => (
                <div
                  key={room.id}
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
                      <p className="font-medium text-sm">{room.name} (Joined)</p>
                      {room.description && <p className="text-xs text-muted-foreground line-clamp-1">{room.description}</p>}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {room.type === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {room.type === 'public' ? 'Public Room' : 'Private Room'}
                        {room.type === 'private' && room.password_hash && ' (Password Protected)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created by: {getRoomCreatorDisplay(room)}
                      </p>
                      {room.closes_at && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Closes in: {formatDistanceToNowStrict(new Date(room.closes_at))}
                        </p>
                      )}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-100 hover:text-red-600"
                      onClick={() => handleLeaveRoom(room.id)}
                      title="Leave Room"
                      disabled={!session}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="sr-only">Leave Room</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="z-[1100]">
          <DialogHeader>
            <DialogTitle>Add Member to Room</DialogTitle>
            <DialogDescription>
              Enter the Email Address of the person you want to invite to this room.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="member-email-input">User Email</Label>
            <Input
              id="member-email-input"
              type="email"
              placeholder="e.g., user@example.com"
              value={memberEmailInput}
              onChange={(e) => setMemberEmailInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMemberSubmit}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}