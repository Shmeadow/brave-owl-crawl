"use client";

import React from "react";
import { useCurrentRoom } from "@/hooks/use-current-room";
import { useSupabase } from "@/integrations/supabase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { currentRoomName, isCurrentRoomWritable } = useCurrentRoom();
  const { session, profile } = useSupabase();

  const displayName = profile?.first_name || profile?.last_name || session?.user?.email?.split('@')[0] || "Guest";

  return (
    <div className={cn(
      "flex flex-col items-center justify-center h-full w-full p-4 md:p-8"
    )}>
      <Card className="w-full max-w-2xl bg-card backdrop-blur-2xl border-white/20 p-6 text-center">
        <CardContent>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Welcome to {currentRoomName === "My Room" ? "your" : currentRoomName}!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            This is your personal space, {displayName}.
          </p>
          <p className="text-md text-muted-foreground mt-2">
            Use the sidebar on the left to open and manage your productivity widgets.
          </p>
          {!isCurrentRoomWritable && (
            <p className="text-sm text-yellow-500 mt-4 font-semibold">
              You are viewing this room in read-only mode. You cannot make changes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}