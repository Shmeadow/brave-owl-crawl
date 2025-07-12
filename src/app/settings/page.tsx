"use client";

import React from "react";
import Link from "next/link";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRooms } from "@/hooks/use-rooms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { session, profile, loading: authLoading } = useSupabase();
  const { rooms, loading: roomsLoading } = useRooms();
  const { currentRoomId, currentRoomName } = useCurrentRoom();

  const currentRoom = rooms.find(room => room.id === currentRoomId);
  const isOwnerOfCurrentRoom = currentRoom && session?.user?.id === currentRoom.creator_id;
  const userOwnsPersonalRoom = !!(profile?.personal_room_id && rooms.find(room => room.id === profile.personal_room_id && room.creator_id === session?.user?.id));


  if (authLoading || roomsLoading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          Your profile settings, including name, avatar, and time format, can be managed on the <Link href="/account" className="text-primary hover:underline">Account Page</Link>.
        </CardContent>
      </Card>

      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">Your Personal Room Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {session ? (
            userOwnsPersonalRoom ? (
              <>Manage your personal room&apos;s name, description, type, password, and background directly from the <span className="font-semibold text-foreground">Settings cog icon</span> in the main header.</>
            ) : (
              <>Create your personal room using the <span className="font-semibold text-foreground">Settings cog icon</span> in the main header.</>
            )
          ) : (
            <>Log in to create and manage your personal room.</>
          )}
        </CardContent>
      </Card>

      {currentRoomId && currentRoom && !userOwnsPersonalRoom && isOwnerOfCurrentRoom ? (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-foreground">Current Room Settings</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            You are currently in &quot;{currentRoomName}&quot;. Room-specific settings for rooms you own (other than your personal room) can be managed within the &quot;Spaces&quot; widget under "Other Rooms You Manage".
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-foreground">Other Room Settings</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Settings for other rooms you manage (not your personal room) can be found within the &quot;Spaces&quot; widget.
          </CardContent>
        </Card>
      )}

      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">Admin Settings</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Global application settings are managed by administrators on the <Link href="/admin-settings" className="text-primary hover:underline">Admin Settings Page</Link>.
        </CardContent>
      </Card>
    </div>
  );
}