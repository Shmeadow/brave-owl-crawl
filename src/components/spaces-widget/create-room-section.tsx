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
import { useCurrentRoom } from "@/hooks/use-current-room"; // Import useCurrentRoom

export function CreateRoomSection() {
  const { session } = useSupabase();
  const { handleCreateRoom } = useRooms();
  const { setCurrentRoom } = useCurrentRoom(); // Use setCurrentRoom

  const [newRoomName, setNewRoomName] = useState("");

  const handleCreateNewRoom = async () => {
    if (!session) {
      toast.error("You must be logged in to create a room.");
      return;
    }
    if (!newRoomName.trim()) {
      toast.error("Room name cannot be empty.");
      return;
    }
    // handleCreateRoom now returns the created room data
    const { data, error } = await handleCreateRoom(newRoomName.trim());
    if (!error && data) {
      setNewRoomName("");
      setCurrentRoom(data.id, data.name); // Set the newly created room as current
    }
  };

  return (
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
        <Button onClick={handleCreateNewRoom} className="w-full" disabled={!session}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create Room
        </Button>
      </CardContent>
    </Card>
  );
}