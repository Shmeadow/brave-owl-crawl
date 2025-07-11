"use client";

import { TimeTracker } from "@/components/time-tracker";
import { useSupabase } from "@/integrations/supabase/auth";
import React from "react";
import { useCurrentRoom } from "@/hooks/use-current-room"; // Import useCurrentRoom

export function TimerPanel() {
  const { session, loading } = useSupabase();
  const { isCurrentRoomWritable } = useCurrentRoom(); // Get writability status

  if (loading) {
    return (
      <div className="bg-card h-full w-full rounded-lg flex flex-col items-center justify-center">
        <p className="text-foreground">Loading time tracker...</p>
      </div>
    );
  }

  return (
    <div className="bg-card h-full w-full rounded-lg flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center h-full py-8 max-w-md mx-auto">
        <TimeTracker isCurrentRoomWritable={isCurrentRoomWritable} />
        {!session && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            You are currently browsing as a guest. Your time tracking data will not be saved unless you log in.
          </p>
        )}
      </div>
    </div>
  );
}