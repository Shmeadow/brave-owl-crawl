"use client";

import React from "react";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRooms } from "@/hooks/use-rooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomOwnerControlsSection } from "@/components/spaces-widget/room-owner-controls-section";

export default function SettingsPage() {
  const { session, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms();
  const { currentRoomId, currentRoomName } = useCurrentRoom();

  const currentRoom = rooms.find(room => room.id === currentRoomId);
  const isOwnerOfCurrentRoom = currentRoom && session?.user?.id === currentRoom.creator_id;

  if (authLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <p className="text-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full py-8">
      <h1 className="text-3xl font-bold text-foreground text-center">Application Settings</h1>

      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">User Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Your profile settings, including name, avatar, and time format, can be managed on the <a href="/account" className="text-primary hover:underline">Account Page</a>.
        </CardContent>
      </Card>

      {currentRoomId && currentRoom ? (
        isOwnerOfCurrentRoom ? (
          <RoomOwnerControlsSection
            currentRoom={currentRoom}
            isOwnerOfCurrentRoom={isOwnerOfCurrentRoom}
          />
        ) : (
          <Card className="w-full bg-card backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-foreground">Room Settings</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              You are currently in "{currentRoomName}". Room-specific settings can only be managed by the room's creator.
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-foreground">Room Settings</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Select a room in the "Spaces" widget to view and manage its settings (if you are the owner).
          </CardContent>
        </Card>
      )}

      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">Admin Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Global application settings are managed by administrators on the <a href="/admin-settings" className="text-primary hover:underline">Admin Settings Page</a>.
        </CardContent>
      </Card>
    </div>
  );
}