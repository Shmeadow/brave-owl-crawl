"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserMinus, Send, Lock, Eye, EyeOff } from "lucide-react";
import { useRooms, RoomData, RoomMember } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { staticImages, animatedBackgrounds } from "@/lib/backgrounds"; // Import backgrounds
import { AnimatedBackgroundPreviewItem } from "../animated-background-preview-item"; // Import AnimatedBackgroundPreviewItem
import Image from "next/image"; // Import Image

interface RoomOwnerControlsSectionProps {
  currentRoom: RoomData;
  isOwnerOfCurrentRoom: boolean;
}

export function RoomOwnerControlsSection({ currentRoom, isOwnerOfCurrentRoom }: RoomOwnerControlsSectionProps) {
  const { supabase, session, profile } = useSupabase();
  const {
    handleSendRoomInvitation,
    handleKickUser,
    handleUpdateRoomType,
    handleSetRoomPassword,
    handleUpdateRoomDescription, // New
    handleUpdateRoomBackground, // New
    fetchRooms,
  } = useRooms();
  const { setCurrentRoom } = useCurrentRoom();

  const [receiverEmailInput, setReceiverEmailInput] = useState("");
  const [selectedUserToKick, setSelectedUserToKick] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [editedRoomName, setEditedRoomName] = useState(currentRoom.name);
  const [editedRoomDescription, setEditedRoomDescription] = useState(currentRoom.description || ""); // New state for description
  const [roomType, setRoomType] = useState<'public' | 'private'>(currentRoom.type);
  const [roomPassword, setRoomPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBackgroundUrl, setSelectedBackgroundUrl] = useState(currentRoom.background_url || "");
  const [selectedIsVideoBackground, setSelectedIsVideoBackground] = useState(currentRoom.is_video_background || false);

  // Effect to update local states when currentRoom prop changes
  useEffect(() => {
    setEditedRoomName(currentRoom.name);
    setEditedRoomDescription(currentRoom.description || "");
    setRoomType(currentRoom.type);
    setSelectedBackgroundUrl(currentRoom.background_url || "");
    setSelectedIsVideoBackground(currentRoom.is_video_background || false);
  }, [currentRoom]);

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

  const handleSendInvitation = useCallback(async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to send invitations.");
      return;
    }
    if (!receiverEmailInput.trim()) {
      toast.error("Recipient Email Address cannot be empty.");
      return;
    }
    await handleSendRoomInvitation(currentRoom.id, receiverEmailInput.trim());
    setReceiverEmailInput("");
  }, [currentRoom.id, isOwnerOfCurrentRoom, receiverEmailInput, handleSendRoomInvitation]);

  const handleKickSelectedUser = useCallback(async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom || !selectedUserToKick) {
      toast.error("Please select a user to kick.");
      return;
    }
    await handleKickUser(currentRoom.id, selectedUserToKick);
    setSelectedUserToKick(null);
  }, [currentRoom.id, isOwnerOfCurrentRoom, selectedUserToKick, handleKickUser]);

  const handleUpdateRoomName = async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom || !supabase || !session) {
      toast.error("You must be the owner of the current room and logged in to change its name.");
      return;
    }
    if (!editedRoomName.trim()) {
      toast.error("Room name cannot be empty.");
      return;
    }

    const { data, error } = await supabase
      .from('rooms')
      .update({ name: editedRoomName.trim() })
      .eq('id', currentRoom.id)
      .eq('creator_id', session.user.id)
      .select('name')
      .single();

    if (error) {
      toast.error("Error updating room name: " + error.message);
      console.error("Error updating room name:", error);
    } else if (data) {
      toast.success(`Room name updated to "${data.name}"!`);
      setCurrentRoom(currentRoom.id, data.name);
      fetchRooms();
    }
  };

  const handleUpdateRoomDescriptionClick = async () => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to change its description.");
      return;
    }
    await handleUpdateRoomDescription(currentRoom.id, editedRoomDescription.trim() || null);
  };

  const handleUpdateRoomTypeClick = async (newType: 'public' | 'private') => {
    if (currentRoom.type === newType) return; // No change needed
    await handleUpdateRoomType(currentRoom.id, newType);
    setRoomType(newType); // Update local state after successful update
  };

  const handleSetPasswordClick = async () => {
    if (roomType === 'public') {
      toast.error("Cannot set a password for a public room. Change room type to private first.");
      return;
    }
    if (!roomPassword.trim()) {
      toast.error("Password cannot be empty.");
      return;
    }
    await handleSetRoomPassword(currentRoom.id, roomPassword.trim());
    setRoomPassword(""); // Clear password input after setting
  };

  const handleRemovePasswordClick = async () => {
    await handleSetRoomPassword(currentRoom.id, null);
  };

  const handleBackgroundChange = async (url: string, isVideo: boolean) => {
    if (!currentRoom.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of the current room to change its background.");
      return;
    }
    await handleUpdateRoomBackground(currentRoom.id, url, isVideo);
    setSelectedBackgroundUrl(url);
    setSelectedIsVideoBackground(isVideo);
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
        {/* Room Name Editing */}
        <div className="space-y-2">
          <Label htmlFor="room-name-edit">Room Name</Label>
          <Input
            id="room-name-edit"
            value={editedRoomName}
            onChange={(e) => setEditedRoomName(e.target.value)}
          />
          <Button onClick={handleUpdateRoomName} className="w-full">
            Update Room Name
          </Button>
        </div>

        {/* Room Description Editing */}
        <div className="space-y-2">
          <Label htmlFor="room-description-edit">Room Description (Optional)</Label>
          <Textarea
            id="room-description-edit"
            placeholder="A brief description of your room..."
            value={editedRoomDescription}
            onChange={(e) => setEditedRoomDescription(e.target.value)}
            rows={3}
          />
          <Button onClick={handleUpdateRoomDescriptionClick} className="w-full">
            Update Room Description
          </Button>
        </div>

        {/* Room Type (Public/Private) */}
        <div className="space-y-2">
          <Label>Room Type</Label>
          <Select value={roomType} onValueChange={handleUpdateRoomTypeClick}>
            <SelectTrigger>
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private (Invite/Password Only)</SelectItem>
              <SelectItem value="public">Public (Anyone Can Join by ID)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {roomType === 'private'
              ? 'Only invited members or those with a password can join.'
              : 'Anyone with the Room ID can join directly.'}
          </p>
        </div>

        {/* Password Management (only for private rooms) */}
        {roomType === 'private' && (
          <div className="space-y-2">
            <Label htmlFor="room-password">Room Password (Optional)</Label>
            <div className="relative">
              <Input
                id="room-password"
                type={showPassword ? "text" : "password"}
                placeholder="Set a password for this room"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
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
            <Button onClick={handleSetPasswordClick} className="w-full" disabled={!roomPassword.trim()}>
              <Lock className="mr-2 h-4 w-4" /> Set Password
            </Button>
            {currentRoom.password_hash && (
              <Button onClick={handleRemovePasswordClick} variant="outline" className="w-full mt-2">
                Remove Password
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              Set a password for this private room. Users can join using this password.
            </p>
          </div>
        )}

        {/* Room Background Selection */}
        <div className="space-y-2">
          <Label>Room Background</Label>
          <Tabs defaultValue="static-images" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="static-images">Static</TabsTrigger>
              <TabsTrigger value="animated-backgrounds">Animated</TabsTrigger>
            </TabsList>

            <TabsContent value="static-images" className="mt-4">
              <ScrollArea className="h-[200px] p-2">
                <div className="grid grid-cols-2 gap-4">
                  {staticImages.map((imageUrl) => {
                    const isActive = !selectedIsVideoBackground && selectedBackgroundUrl === imageUrl;
                    return (
                      <div
                        key={imageUrl}
                        className={`relative w-full h-24 cursor-pointer rounded-md overflow-hidden group ${
                          isActive
                            ? "ring-2 ring-blue-500 ring-offset-2"
                            : "hover:ring-2 hover:ring-gray-300"
                        }`}
                        onClick={() => handleBackgroundChange(imageUrl, false)}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Background ${imageUrl.split("/").pop()}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={false}
                        />
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 text-white text-sm font-bold">
                            Active
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="animated-backgrounds" className="mt-4">
              <ScrollArea className="h-[200px] p-2">
                <div className="grid grid-cols-2 gap-4">
                  {animatedBackgrounds.map((bg) => (
                    <AnimatedBackgroundPreviewItem
                      key={bg.videoUrl}
                      videoUrl={bg.videoUrl}
                      isActive={selectedIsVideoBackground && selectedBackgroundUrl === bg.videoUrl}
                      onClick={handleBackgroundChange}
                      previewOffset={bg.previewOffset}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Send Invitation */}
        <div className="space-y-2">
          <Label htmlFor="send-invitation-user-email">Send Invitation (by Email)</Label>
          <Input
            id="send-invitation-user-email"
            type="email"
            placeholder="Enter Recipient Email Address"
            value={receiverEmailInput}
            onChange={(e) => setReceiverEmailInput(e.target.value)}
          />
          <Button onClick={handleSendInvitation} className="w-full">
            <Send className="mr-2 h-4 w-4" /> Send Invitation
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Send an invitation to another user by their email address. They will receive a notification to join.
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