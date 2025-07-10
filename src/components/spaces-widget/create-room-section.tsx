"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useRooms } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Textarea } from "@/components/ui/textarea"; // Import Textarea

interface CreateRoomSectionProps {
  userOwnsRoom: boolean;
}

export function CreateRoomSection({ userOwnsRoom }: CreateRoomSectionProps) {
  const { session } = useSupabase();
  const { handleCreateRoom } = useRooms();
  const { setCurrentRoom } = useCurrentRoom();

  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('private'); // Default to private
  const [newRoomDescription, setNewRoomDescription] = useState(""); // New state for description

  const handleCreateNewRoom = async () => {
    if (!session) {
      toast.error("You must be logged in to create a room.");
      return;
    }
    if (!newRoomName.trim()) {
      toast.error("Room name cannot be empty.");
      return;
    }
    const { data, error } = await handleCreateRoom(newRoomName.trim(), newRoomType, newRoomDescription.trim() || null); // Pass newRoomType and newRoomDescription
    if (!error && data) {
      setNewRoomName("");
      setNewRoomDescription(""); // Clear description after creation
      setCurrentRoom(data.id, data.name);
    }
  };

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Create New Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userOwnsRoom ? (
          <p className="text-muted-foreground text-center">
            You already own a room. You can manage it below.
          </p>
        ) : (
          <>
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
            <div className="space-y-2">
              <Label htmlFor="new-room-description">Description (Optional)</Label>
              <Textarea
                id="new-room-description"
                placeholder="A brief description of your room..."
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                rows={3}
                disabled={!session}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-room-type">Room Type</Label>
              <Select value={newRoomType} onValueChange={(value: 'public' | 'private') => setNewRoomType(value)} disabled={!session}>
                <SelectTrigger id="new-room-type">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Invite/Password Only)</SelectItem>
                  <SelectItem value="public">Public (Anyone Can Join by ID)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateNewRoom} className="w-full" disabled={!session}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Room
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}