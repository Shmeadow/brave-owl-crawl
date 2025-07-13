"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useRooms } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

export function RoomActions() {
  const { session } = useSupabase();
  const { handleJoinRoomByPassword } = useRooms();

  const [roomIdInput, setRoomIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleJoinRoom = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Room or User ID.");
      return;
    }
    await handleJoinRoomByPassword(roomIdInput.trim(), passwordInput.trim());
    setRoomIdInput("");
    setPasswordInput("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="join-room-id">Room or User ID</Label>
        <Input id="join-room-id" placeholder="Enter Room or User ID" value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value)} disabled={!session} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="join-room-password">Password (if private)</Label>
        <div className="relative">
          <Input id="join-room-password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} disabled={!session} />
          <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <Button onClick={handleJoinRoom} className="w-full" disabled={!roomIdInput.trim() || !session}>
        <LogIn className="mr-2 h-4 w-4" /> Join Room
      </Button>
    </div>
  );
}