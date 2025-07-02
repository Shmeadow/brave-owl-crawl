"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Lock, Unlock, Trash2, LogIn, Share2, LogOut, KeyRound, UserMinus, Users } from "lucide-react";
import { useRooms, RoomData, RoomMember } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SpacesWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function SpacesWidget({ isCurrentRoomWritable }: SpacesWidgetProps) {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const {
    rooms,
    loading: roomsLoading,
    handleCreateRoom,
    handleToggleRoomPublicStatus,
    handleToggleGuestWriteAccess, // New
    handleSetRoomPassword, // New
    handleKickUser, // New
    handleGenerateInviteCode,
    handleJoinRoomByCode,
    handleJoinRoomByPassword, // New
    handleLeaveRoom,
    fetchRooms, // Re-fetch after actions
  } = useRooms();
  const { currentRoomId, currentRoomName, setCurrentRoom } = useCurrentRoom();

  const [newRoomName, setNewRoomName] = useState("");
  const [isNewRoomPublic, setIsNewRoomPublic] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinPasswordInput, setJoinPasswordInput] = useState(""); // New
  const [setPasswordInput, setSetPasswordInput] = useState(""); // New
  const [generatedInviteCodes, setGeneratedInviteCodes] = useState<{ [roomId: string]: string | null }>({});
  const [selectedUserToKick, setSelectedUserToKick] = useState<string | null>(null); // New
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]); // New state for members

  const currentRoom = rooms.find(room => room.id === currentRoomId);
  const isOwnerOfCurrentRoom = currentRoom && session?.user?.id === currentRoom.creator_id;

  // Fetch room members when currentRoomId changes and user is owner
  useEffect(() => {
    const fetchRoomMembers = async () => {
      if (!supabase || !currentRoomId || !isOwnerOfCurrentRoom) {
        setRoomMembers([]);
        return;
      }

      const { data, error } = await supabase
        .from('room_members')
        .select(`
          id,
          room_id,
          user_id,
          joined_at,
          profiles (
            first_name,
            last_name,
            profile_image_url
          )
        `)
        .eq('room_id', currentRoomId);

      if (error) {
        console.error("Error fetching room members:", error);
        setRoomMembers([]);
      } else {
        setRoomMembers(data as RoomMember[]);
      }
    };

    fetchRoomMembers();
  }, [supabase, currentRoomId, isOwnerOfCurrentRoom, fetchRooms]); // Added fetchRooms to dependencies to re-fetch members after kick

  const handleCreateNewRoom = async () => {
    if (!session) {
      toast.error("You must be logged in to create a room.");
      return;
    }
    if (!newRoomName.trim()) {
      toast.error("Room name cannot be empty.");
      return;
    }
    await handleCreateRoom(newRoomName.trim(), isNewRoomPublic);
    setNewRoomName("");
    setIsNewRoomPublic(false);
  };

  const handleEnterRoom = (room: RoomData) => {
    if (!session && !room.is_public && !room.password_hash) { // Guests can't enter private rooms without password
      toast.error("You must be logged in to enter a private room.");
      return;
    }
    setCurrentRoom(room.id, room.name);
  };

  const handleGenerateCodeClick = async (roomId: string) => {
    if (!session) {
      toast.error("You must be logged in to generate an invite code.");
      return;
    }
    const code = await handleGenerateInviteCode(roomId);
    if (code) {
      setGeneratedInviteCodes(prev => ({ ...prev, [roomId]: code }));
    }
  };

  const handleJoinCodeSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!inviteCodeInput.trim()) {
      toast.error("Please enter an invite code.");
      return;
    }
    await handleJoinRoomByCode(inviteCodeInput.trim());
    setInviteCodeInput("");
  };

  const handleJoinPasswordSubmit = async (roomId: string) => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!joinPasswordInput.trim()) {
      toast.error("Please enter the room password.");
      return;
    }
    await handleJoinRoomByPassword(roomId, joinPasswordInput.trim());
    setJoinPasswordInput("");
  };

  const handleSetPassword = async () => {
    if (!currentRoomId || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to set its password.");
      return;
    }
    if (!setPasswordInput.trim()) {
      toast.error("Password cannot be empty. To remove, click 'Remove Password'.");
      return;
    }
    await handleSetRoomPassword(currentRoomId, setPasswordInput.trim());
    setSetPasswordInput("");
  };

  const handleRemovePassword = async () => {
    if (!currentRoomId || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to remove its password.");
      return;
    }
    await handleSetRoomPassword(currentRoomId, undefined); // Pass undefined to remove password
    setSetPasswordInput("");
  };

  const handleKickSelectedUser = async () => {
    if (!currentRoomId || !isOwnerOfCurrentRoom || !selectedUserToKick) {
      toast.error("Please select a user to kick.");
      return;
    }
    await handleKickUser(currentRoomId, selectedUserToKick);
    setSelectedUserToKick(null);
  };

  const getRoomCreatorName = (creatorId: string) => {
    if (session?.user?.id === creatorId) {
      return profile?.first_name || profile?.last_name || "You";
    }
    return `User (${creatorId.substring(0, 4)}...)`;
  };

  if (authLoading || roomsLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading rooms...</p>
      </div>
    );
  }

  const myCreatedRooms = rooms.filter(room => room.creator_id === session?.user?.id);
  const myJoinedRooms = rooms.filter(room => room.is_member && room.creator_id !== session?.user?.id);
  const publicRooms = rooms.filter(room => room.is_public && room.creator_id !== session?.user?.id && !room.is_member);

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto py-4">
        <h1 className="text-3xl font-bold text-foreground text-center">Explore & Manage Rooms</h1>

        {session && (
          <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Create New Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-room-name">Room Name</Label>
                <Input
                  id="new-room-name"
                  placeholder="e.g., Cozy Study Nook"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  disabled={!session}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="new-room-public">Make Public</Label>
                <Switch
                  id="new-room-public"
                  checked={isNewRoomPublic}
                  onCheckedChange={setIsNewRoomPublic}
                  disabled={!session}
                />
              </div>
              <Button onClick={handleCreateNewRoom} className="w-full" disabled={!session}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Room
              </Button>
            </CardContent>
          </Card>
        )}

        {session && (myCreatedRooms.length > 0 || myJoinedRooms.length > 0) && (
          <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">My Rooms & Joined Rooms</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {myCreatedRooms.map((room) => (
                    <div
                      key={room.id}
                      className={cn(
                        "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl",
                        currentRoomId === room.id && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex-1 pr-2 mb-2 sm:mb-0">
                        <p className="font-medium text-sm">{room.name} (Created by You)</p>
                        <p className="text-xs text-muted-foreground">
                          {room.is_public ? "Public" : "Private"}
                          {room.password_hash && " (Password Protected)"}
                        </p>
                        {!room.is_public && generatedInviteCodes[room.id] && (
                          <p className="text-xs text-primary mt-1">Invite Code: <span className="font-bold">{generatedInviteCodes[room.id]}</span></p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 sm:ml-auto">
                        {!room.is_public && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleGenerateCodeClick(room.id)}
                            title="Generate Invite Code"
                            disabled={!session}
                          >
                            <Share2 className="h-4 w-4" />
                            <span className="sr-only">Generate Invite Code</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleRoomPublicStatus(room.id, room.is_public)}
                          title={room.is_public ? "Make Private" : "Make Public"}
                          disabled={!session}
                        >
                          {room.is_public ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          <span className="sr-only">{room.is_public ? "Make Private" : "Make Public"}</span>
                        </Button>
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
                          onClick={() => handleDeleteRoom(room.id)}
                          title="Delete Room"
                          disabled={!session}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete Room</span>
                        </Button>
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
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-sm">{room.name} (Joined)</p>
                        <p className="text-xs text-muted-foreground">
                          Created by: {getRoomCreatorName(room.creator_id)}
                        </p>
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
        )}

        {session && (
          <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Join Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-code">Invite Code</Label>
                <Input
                  id="invite-code"
                  placeholder="Enter invite code"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  disabled={!session}
                />
              </div>
              <Button onClick={handleJoinCodeSubmit} className="w-full" disabled={!session}>
                <LogIn className="mr-2 h-4 w-4" /> Join by Code
              </Button>
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="join-password">Room Password</Label>
                <Input
                  id="join-password"
                  type="password"
                  placeholder="Enter room password"
                  value={joinPasswordInput}
                  onChange={(e) => setJoinPasswordInput(e.target.value)}
                  disabled={!session || !currentRoomId}
                />
              </div>
              <Button onClick={() => currentRoomId && handleJoinPasswordSubmit(currentRoomId)} className="w-full" disabled={!session || !currentRoomId}>
                <LogIn className="mr-2 h-4 w-4" /> Join by Password
              </Button>
            </CardContent>
          </Card>
        )}

        {publicRooms.length > 0 && (
          <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Public Rooms</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-3">
                  {publicRooms.map((room) => (
                    <div
                      key={room.id}
                      className={cn(
                        "flex items-center justify-between p-3 border rounded-md bg-muted backdrop-blur-xl",
                        currentRoomId === room.id && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-medium text-sm">{room.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Created by: {getRoomCreatorName(room.creator_id)}
                          {room.password_hash && " (Password Protected)"}
                        </p>
                      </div>
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
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Owner-only controls for the current room */}
        {isOwnerOfCurrentRoom && currentRoomId && currentRoom && (
          <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Current Room Owner Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 1. Allow Guest Write Access */}
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-guest-write" className="text-base">
                  Allow Guests to Write
                </Label>
                <Switch
                  id="allow-guest-write"
                  checked={currentRoom.allow_guest_write}
                  onCheckedChange={(checked) => handleToggleGuestWriteAccess(currentRoom.id, currentRoom.allow_guest_write)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, members of this room (who are not the creator) will be able to add/edit content in widgets.
              </p>

              {/* 2. Set/Remove Room Password */}
              <div className="space-y-2">
                <Label htmlFor="set-room-password">Set Room Password</Label>
                <Input
                  id="set-room-password"
                  type="password"
                  placeholder="Enter new password"
                  value={setPasswordInput}
                  onChange={(e) => setSetPasswordInput(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSetPassword} className="flex-1">
                    <KeyRound className="mr-2 h-4 w-4" /> Set Password
                  </Button>
                  <Button onClick={handleRemovePassword} variant="outline" className="flex-1" disabled={!currentRoom.password_hash}>
                    Remove Password
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Set a password for this room. Users will need this to join if it's private.
              </p>

              {/* 3. Kick Users */}
              {roomMembers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="kick-user-select">Kick a User</Label>
                  <Select onValueChange={setSelectedUserToKick} value={selectedUserToKick || ""}>
                    <SelectTrigger id="kick-user-select">
                      <SelectValue placeholder="Select a user to kick" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomMembers.filter(member => member.user_id !== session?.user?.id).map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.profiles?.first_name || member.profiles?.last_name || `User (${member.user_id.substring(0, 8)}...)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleKickSelectedUser} className="w-full" disabled={!selectedUserToKick}>
                    <UserMinus className="mr-2 h-4 w-4" /> Kick User
                  </Button>
                </div>
              )}
              {roomMembers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">No other members in this room to kick.</p>
              )}
            </CardContent>
          </Card>
        )}

        {!session && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Log in to create your own rooms, manage their privacy settings, and join private rooms via invite codes.
          </p>
        )}
      </div>
    </div>
  );
}