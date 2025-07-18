"use client";

import { TimeTracker } from "@/components/time-tracker";
import { useSupabase } from "@/integrations/supabase/auth";
import React from "react";
import { useCurrentRoom } from "@/hooks/use-current-room";

interface TimerWidgetProps {
  isCurrentRoomWritable: boolean;
}

export function TimerWidget({ isCurrentRoomWritable }: TimerWidgetProps) {
  const { session, loading } = useSupabase();

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading time tracker...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4">
      <TimeTracker isCurrentRoomWritable={isCurrentRoomWritable} />
      {!session && (
        <p className="text-sm text-muted-foreground mt-4 text-center">
          You are currently browsing as a guest. Your time tracking data will not be saved unless you log in.
        </p>
      )}
    </div>
  );
}