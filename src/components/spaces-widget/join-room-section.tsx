"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Lock, Eye, EyeOff, Globe } from "lucide-react"; // Added Globe icon
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function JoinRoomSection() {
  const { session } = useSupabase();
  const { handleSendRoomInvitation, handleJoinRoomByRoomId, handleJoinRoomByPassword, rooms } = useRooms();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const myCreatedRooms = rooms.filter(room => room.creator_id === session?.user?.id);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(myCreatedRooms.length > 0 ? myCreatedRooms[0].id : null);
  const [receiverEmail, setReceiverEmail] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const handleJoinById = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!joinRoomId.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }
    const roomToJoin = rooms.find(r => r.id === joinRoomId.trim());
    if (roomToJoin) {
      await handleJoinRoomByRoomId(joinRoomId.trim());
      setCurrentRoom(roomToJoin.id, roomToJoin.name);
      setJoinRoomId("");
    } else {
      toast.error("Room not found or you don't have access.");
    }
  };

  const handleJoinByPasswordSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!joinRoomId.trim() || !joinPassword.trim()) {
      toast.error("Please enter both Room ID and Password.");
      return;
    }
    const roomToJoin = rooms.find(r => r.id === joinRoomId.trim());
    if (!roomToJoin) {
      toast.error("Room not found.");
      return;
    }
    await handleJoinRoomByPassword(joinRoomId.trim(), joinPassword.trim());
    setCurrentRoom(roomToJoin.id, roomToJoin.name);
    setJoinRoomId("");
    setJoinPassword("");
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Join or Invite to Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section: Send Invitation */}
        <div className="space-y-2">
          <Label htmlFor="room-select-input">Select Your Room to Invite From</Label>
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
                <SelectItem value="no-rooms-placeholder" disabled>No rooms created by you</SelectItem>
              )}
              {myCreatedRooms.map(room => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.type === 'public' ? 'Public' : 'Private'})
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

        {/* Separator */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border" /><span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span><div className="flex-grow border-t border-border" />
        </div>

        {/* Section: Join by ID */}
        <div className="space-y-2">
          <Label htmlFor="join-room-id">Join by Room ID</Label>
          <Input
            id="join-room-id"
            placeholder="Enter Room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            disabled={!session}
          />
          <Button onClick={handleJoinById} className="w-full" disabled={!session || !joinRoomId.trim()}>
            <Globe className="mr-2 h-4 w-4" /> Join Public Room
          </Button>
          <p className="text-sm text-muted-foreground">
            Join a public room directly using its ID.
          </p>
        </div>

        {/* Section: Join by Password */}
        <div className="space-y-2">
          <Label htmlFor="join-room-password">Join Private Room by Password</Label>
          <Input
            id="join-room-id-password"
            placeholder="Enter Room ID"
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            disabled={!session}
            className="mb-2"
          />
          <div className="relative">
            <Input
              id="join-room-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter Room Password"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
              disabled={!session}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={handleJoinByPasswordSubmit} className="w-full" disabled={!session || !joinRoomId.trim() || !joinPassword.trim()}>
            <Lock className="mr-2 h-4 w-4" /> Join Private Room
          </Button>
          <p className="text-sm text-muted-foreground">
            Join a private room that is protected by a password.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}