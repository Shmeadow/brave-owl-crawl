"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserMinus, UserPlus } from "lucide-react"; // Added UserPlus
import { useRooms, RoomData, RoomMember } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

interface RoomOwnerControlsSectionProps {
  currentRoom: RoomData;
  isOwnerOfCurrentRoom: boolean;
}

export function RoomOwnerControlsSection({ currentRoom, isOwnerOfCurrentRoom }: RoomOwnerControlsSectionProps) {
  const { supabase, session, profile } = useSupabase();
  const {
    handleAddRoomMember, // New function
    handleKickUser,
    fetchRooms, // To re-fetch members after kick
  } = useRooms();

  const [memberUserIdInput, setMemberUserIdInput] = useState(""); // For adding new member
  const [selectedUserToKick, setSelectedUserToKick] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);

  // Fetch room members when currentRoom changes and user is owner
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

  const handleAddMember = async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to add members.");
      return;
    }
    if (!memberUserIdInput.trim()) {
      toast.error("User ID cannot be empty.");
      return;
    }
    await handleAddRoomMember(currentRoom.id, memberUserIdInput.trim());
    setMemberUserIdInput("");
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
        {/* Add Member */}
        <div className="space-y-2">
          <Label htmlFor="add-member-user-id">Add Member (by User ID)</Label>
          <Input
            id="add-member-user-id"
            placeholder="Enter User ID"
            value={memberUserIdInput}
            onChange={(e) => setMemberUserIdInput(e.target.value)}
          />
          <Button onClick={handleAddMember} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Add users to this room by their unique User ID. They will then be able to join.
        </p>

        {/* Kick Users */}
        {roomMembers.filter(member => member.user_id !== session?.user?.id).length > 0 ? (
          <div className="space-y-2">
            <Label htmlFor="kick-user-select">Kick a User</Label>
            <Select onValueChange={setSelectedUserToKick} value={selectedUserToKick || ""}>
              <SelectTrigger id="kick-user-select">
                <SelectValue placeholder="Select a user to kick" />
              </SelectTrigger>
              <SelectContent>
                {roomMembers.filter(member => member.user_id !== session?.user?.id).map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.profiles?.[0]?.first_name || member.profiles?.[0]?.last_name || `User (${member.user_id.substring(0, 8)}...)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleKickSelectedUser} className="w-full" disabled={!selectedUserToKick}>
              <UserMinus className="mr-2 h-4 w-4" /> Kick User
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">No other members in this room to kick.</p>
        )}
      </CardContent>
    </Card>
  );
}