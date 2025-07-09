"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Lock, Eye, EyeOff, Globe, UserPlus, LogIn } from "lucide-react"; // Added LogIn
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function JoinRoomSection() {
  const { session } = useSupabase();
  const { handleSendRoomInvitation, handleJoinRoomByRoomId, handleJoinRoomByPassword, rooms } = useRooms();
  const { currentRoomId, setCurrentRoom } = useCurrentRoom();

  const myCreatedRooms = rooms.filter(room => room.creator_id === session?.user?.id);

  const [activeTab, setActiveTab] = useState("join"); // 'join' or 'invite'
  const [roomIdInput, setRoomIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRoomToInviteFrom, setSelectedRoomToInviteFrom] = useState<string | null>(myCreatedRooms.length > 0 ? myCreatedRooms[0].id : null);

  const handleJoinRoom = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }

    const roomToJoin = rooms.find(r => r.id === roomIdInput.trim());

    if (!roomToJoin) {
      toast.error("Room not found or you don't have access.");
      return;
    }

    if (roomToJoin.type === 'public') {
      await handleJoinRoomByRoomId(roomIdInput.trim());
      setCurrentRoom(roomToJoin.id, roomToJoin.name);
      setRoomIdInput("");
      setPasswordInput("");
    } else { // Private room
      if (!passwordInput.trim()) {
        toast.error("This is a private room. Please enter the password.");
        return;
      }
      await handleJoinRoomByPassword(roomIdInput.trim(), passwordInput.trim());
      setCurrentRoom(roomToJoin.id, roomToJoin.name);
      setRoomIdInput("");
      setPasswordInput("");
    }
  };

  const handleSendInvitationSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to send invitations.");
      return;
    }
    if (!selectedRoomToInviteFrom) {
      toast.error("Please select a room you own to send an invitation from.");
      return;
    }
    if (!inviteEmail.trim()) {
      toast.error("Please enter the recipient's Email Address.");
      return;
    }
    await handleSendRoomInvitation(selectedRoomToInviteFrom, inviteEmail.trim());
    setInviteEmail("");
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Join or Invite to a Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join" disabled={!session}>Join Room</TabsTrigger>
            <TabsTrigger value="invite" disabled={!session || myCreatedRooms.length === 0}>Invite to My Room</TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-room-id">Room ID</Label>
              <Input
                id="join-room-id"
                placeholder="Enter Room ID"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value)}
                disabled={!session}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="join-room-password">Password (for Private Rooms)</Label>
              <div className="relative">
                <Input
                  id="join-room-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password if private"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
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
            </div>
            <Button onClick={handleJoinRoom} className="w-full" disabled={!session || !roomIdInput.trim()}>
              <LogIn className="mr-2 h-4 w-4" /> Join Room
            </Button>
            {!session && (
              <p className="text-sm text-muted-foreground text-center">Log in to join rooms.</p>
            )}
          </TabsContent>

          <TabsContent value="invite" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-select-input">Select Your Room to Invite From</Label>
              <Select
                value={selectedRoomToInviteFrom || ""}
                onValueChange={(value) => setSelectedRoomToInviteFrom(value)}
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
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={!session || !selectedRoomToInviteFrom}
              />
            </div>
            <Button onClick={handleSendInvitationSubmit} className="w-full" disabled={!session || !selectedRoomToInviteFrom || !inviteEmail.trim()}>
              <UserPlus className="mr-2 h-4 w-4" /> Send Invitation
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}