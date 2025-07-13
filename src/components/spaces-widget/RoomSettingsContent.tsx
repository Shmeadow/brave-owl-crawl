"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserMinus, Send, Lock, Eye, EyeOff } from "lucide-react";
import { useRooms, RoomData, RoomMember } from "@/hooks/use-rooms";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { staticImages, animatedBackgrounds } from "@/lib/backgrounds";
import { AnimatedBackgroundPreviewItem } from "../animated-background-preview-item";
import Image from "next/image";

interface RoomSettingsContentProps {
  room: RoomData;
}

export function RoomSettingsContent({ room }: RoomSettingsContentProps) {
  const { supabase, session, profile } = useSupabase();
  const {
    handleSendRoomInvitation,
    handleKickUser,
    handleUpdateRoomType,
    handleSetRoomPassword,
    handleUpdateRoomDescription,
    handleUpdateRoomBackground,
    handleUpdateRoomName,
    fetchRooms,
  } = useRooms();
  const { setCurrentRoom } = useCurrentRoom();

  const isOwnerOfCurrentRoom = room.creator_id === session?.user?.id;

  const [receiverEmailInput, setReceiverEmailInput] = useState("");
  const [selectedUserToKick, setSelectedUserToKick] = useState<string | null>(null);
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [editedRoomName, setEditedRoomName] = useState(room.name);
  const [editedRoomDescription, setEditedRoomDescription] = useState(room.description || "");
  const [roomType, setRoomType] = useState<'public' | 'private'>(room.type);
  const [roomPassword, setRoomPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBackgroundUrl, setSelectedBackgroundUrl] = useState(room.background_url || "");
  const [selectedIsVideoBackground, setSelectedIsVideoBackground] = useState(room.is_video_background || false);

  // Effect to update local states when room prop changes
  useEffect(() => {
    setEditedRoomName(room.name);
    setEditedRoomDescription(room.description || "");
    setRoomType(room.type);
    setSelectedBackgroundUrl(room.background_url || "");
    setSelectedIsVideoBackground(room.is_video_background || false);
  }, [room]);

  // Fetch room members when room changes and user is owner
  useEffect(() => {
    const fetchRoomMembers = async () => {
      if (!supabase || !room.id || !isOwnerOfCurrentRoom) {
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
        .eq('room_id', room.id);

      if (error) {
        console.error("Error fetching room members:", error);
        setRoomMembers([]);
      } else {
        setRoomMembers(data as RoomMember[]);
      }
    };

    fetchRoomMembers();
  }, [supabase, room.id, isOwnerOfCurrentRoom, fetchRooms]);

  const handleSendInvitation = useCallback(async () => {
    if (!room.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of this room to send invitations.");
      return;
    }
    if (!receiverEmailInput.trim()) {
      toast.error("Recipient Email Address cannot be empty.");
      return;
    }
    await handleSendRoomInvitation(room.id, receiverEmailInput.trim());
    setReceiverEmailInput("");
  }, [room.id, isOwnerOfCurrentRoom, receiverEmailInput, handleSendRoomInvitation]);

  const handleKickSelectedUser = useCallback(async () => {
    if (!room.id || !isOwnerOfCurrentRoom || !selectedUserToKick) {
      toast.error("Please select a user to kick.");
      return;
    }
    await handleKickUser(room.id, selectedUserToKick);
    setSelectedUserToKick(null);
  }, [room.id, isOwnerOfCurrentRoom, selectedUserToKick, handleKickUser]);

  const handleUpdateRoomNameClick = async () => {
    const { data, error } = await handleUpdateRoomName(room.id, editedRoomName);
    if (!error && data) {
      setCurrentRoom(room.id, data.name);
    }
  };

  const handleUpdateRoomDescriptionClick = async () => {
    if (!room.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of this room to change its description.");
      return;
    }
    await handleUpdateRoomDescription(room.id, editedRoomDescription.trim() || null);
  };

  const handleUpdateRoomTypeClick = async (newType: 'public' | 'private') => {
    if (room.type === newType) return;
    await handleUpdateRoomType(room.id, newType);
    setRoomType(newType);
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
    await handleSetRoomPassword(room.id, roomPassword.trim());
    setRoomPassword("");
  };

  const handleRemovePasswordClick = async () => {
    await handleSetRoomPassword(room.id, null);
  };

  const handleBackgroundChange = async (url: string, isVideo: boolean) => {
    if (!room.id || !isOwnerOfCurrentRoom) {
      toast.error("You must be the owner of this room to change its background.");
      return;
    }
    await handleUpdateRoomBackground(room.id, url, isVideo);
    setSelectedBackgroundUrl(url);
    setSelectedIsVideoBackground(isVideo);
  };

  if (!isOwnerOfCurrentRoom) {
    return null;
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Room Options</h3>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="room-name-edit">Room Name</Label>
            <Input
              id="room-name-edit"
              placeholder="e.g., Cozy Study Nook"
              value={editedRoomName}
              onChange={(e) => setEditedRoomName(e.target.value)}
            />
            <Button onClick={handleUpdateRoomNameClick} className="w-full">
              Update Room Name
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room-description-edit">Description (Optional)</Label>
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
        </TabsContent>

        <TabsContent value="access" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Select value={roomType} onValueChange={handleUpdateRoomTypeClick}>
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent className="z-[1200]">
                <SelectItem value="private">Private (Invite/Password Only)</SelectItem>
                <SelectItem value="public">Public (Anyone Can Join by ID)</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              {room.password_hash && (
                <Button onClick={handleRemovePasswordClick} variant="outline" className="w-full mt-2">
                  Remove Password
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4 space-y-4">
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
          {roomMembers.filter(member => member.user_id !== session?.user?.id).length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="kick-user-select">Kick a User</Label>
              <Select onValueChange={setSelectedUserToKick} value={selectedUserToKick || ""}>
                <SelectTrigger id="kick-user-select">
                  <SelectValue placeholder="Select a user to kick" />
                </SelectTrigger>
                <SelectContent className="z-[1200]">
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
            <p className="text-sm text-muted-foreground text-center">No other members in this room.</p>
          )}
        </TabsContent>

        <TabsContent value="appearance" className="mt-4 space-y-2">
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
                        className={`relative w-full h-24 cursor-pointer rounded-md overflow-hidden group ${isActive ? "ring-2 ring-blue-500 ring-offset-2" : "hover:ring-2 hover:ring-gray-300"}`}
                        onClick={() => handleBackgroundChange(imageUrl, false)}
                      >
                        <Image src={imageUrl} alt={`Background ${imageUrl.split("/").pop()}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={false} />
                        {isActive && <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50 text-white text-sm font-bold">Active</div>}
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
                    <AnimatedBackgroundPreviewItem key={bg.videoUrl} videoUrl={bg.videoUrl} isActive={selectedIsVideoBackground && selectedBackgroundUrl === bg.videoUrl} onClick={handleBackgroundChange} previewOffset={bg.previewOffset} />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}