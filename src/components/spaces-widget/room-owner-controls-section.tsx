"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, UserMinus } from "lucide-react";
import { useRooms, RoomData, RoomMember } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

interface RoomOwnerControlsSectionProps {
  currentRoom: RoomData;
  isOwnerOfCurrentRoom: boolean;
}

export function RoomOwnerControlsSection({ currentRoom, isOwnerOfCurrentRoom }: RoomOwnerControlsSectionProps) {
  const { supabase, session } = useSupabase(); // Removed 'profile' as it was unused
  const {
    handleToggleGuestWriteAccess,
    handleSetRoomPassword,
    handleKickUser,
    fetchRooms,
  } = useRooms();

  const [setPasswordInput, setSetPasswordInput] = useState("");
  const [selectedUserToKick, setSelectedUserToKick] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);

  useEffect(() => {
    const fetchRoomMembers = async () => {
      if (!supabase || !currentRoom.id || !isOwnerOfCurrentRoom) {
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
        .eq('room_id', currentRoom.id);

      if (error) {
        console.error("Error fetching room members:", error);
        setRoomMembers([]);
      } else {
        setRoomMembers(data as RoomMember[]);
      }
    };

    fetchRoomMembers();
  }, [supabase, currentRoom.id, isOwnerOfCurrentRoom, fetchRooms]);

  const handleSetPassword = async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to set its password.");
      return;
    }
    if (!setPasswordInput.trim()) {
      toast.error("Password cannot be empty. To remove, click 'Remove Password'.");
      return;
    }
    await handleSetRoomPassword(currentRoom.id, setPasswordInput.trim());
    setSetPasswordInput("");
  };

  const handleRemovePassword = async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to remove its password.");
      return;
    }
    await handleSetRoomPassword(currentRoom.id, undefined);
    setSetPasswordInput("");
  };

  const handleKickSelectedUser = async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom || !selectedUserToKick) {
      toast.error("Please select a user to kick.");
      return;
    }
    await handleKickUser(currentRoom.id, selectedUserToKick);
    setSelectedUserToKick(null);
  };

  if (!isOwnerOfCurrentRoom || !currentRoom) {
    return null;
  }

  return (
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
            onCheckedChange={(checkedStatus) => handleToggleGuestWriteAccess(currentRoom.id, currentRoom.allow_guest_write)}
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
          Set a password for this room. Users will need this to join if it&apos;s private.
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
  );
}