"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, PlusCircle, Eye, EyeOff } from "lucide-react";
import { useRooms } from "@/hooks/use-rooms";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RoomActions() {
  const { session } = useSupabase();
  const { handleJoinRoomByRoomId, handleJoinRoomByPassword, handleCreateRoom } = useRooms();
  const { setCurrentRoom } = useCurrentRoom();

  const [roomIdInput, setRoomIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomType, setNewRoomType] = useState<'public' | 'private'>('private');

  const handleJoinRoom = async () => {
    if (!session) {
      toast.error("You must be logged in to join a room.");
      return;
    }
    if (!roomIdInput.trim()) {
      toast.error("Please enter a Room ID.");
      return;
    }
    await handleJoinRoomByPassword(roomIdInput.trim(), passwordInput.trim());
    setRoomIdInput("");
    setPasswordInput("");
  };

  const handleCreateRoomSubmit = async () => {
    if (!session) {
      toast.error("You must be logged in to create a room.");
      return;
    }
    if (!newRoomName.trim()) {
      toast.error("Please enter a room name.");
      return;
    }
    const { data, error } = await handleCreateRoom(newRoomName.trim(), newRoomType, newRoomDescription.trim() || null);
    if (!error && data) {
      setCurrentRoom(data.id, data.name);
      setNewRoomName("");
      setNewRoomDescription("");
    }
  };

  return (
    <Card className="w-full bg-background/50 backdrop-blur-xl border-white/20 p-4">
      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="join" disabled={!session}>Join Room</TabsTrigger>
          <TabsTrigger value="create" disabled={!session}>Create Room</TabsTrigger>
        </TabsList>

        <TabsContent value="join" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-room-id">Room ID</Label>
            <Input id="join-room-id" placeholder="Enter Room ID" value={roomIdInput} onChange={(e) => setRoomIdInput(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-room-password">Password (if private)</Label>
            <div className="relative">
              <Input id="join-room-password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button onClick={handleJoinRoom} className="w-full" disabled={!roomIdInput.trim()}>
            <LogIn className="mr-2 h-4 w-4" /> Join Room
          </Button>
        </TabsContent>

        <TabsContent value="create" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-room-name">Room Name</Label>
            <Input id="create-room-name" placeholder="e.g., My Study Group" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-room-desc">Description (Optional)</Label>
            <Textarea id="create-room-desc" placeholder="A brief description..." value={newRoomDescription} onChange={(e) => setNewRoomDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Select value={newRoomType} onValueChange={(value: 'public' | 'private') => setNewRoomType(value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreateRoomSubmit} className="w-full" disabled={!newRoomName.trim()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Room
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
}