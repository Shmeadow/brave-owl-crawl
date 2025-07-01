"use client";

import { TimeTracker } from "@/components/time-tracker";
import { useSupabase } from "@/integrations/supabase/auth";
import React from "react";

export function TimerWidget() {
  const { session, loading } = useSupabase();

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center">
        <p className="text-foreground">Loading time tracker...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center h-full py-8 max-w-md mx-auto">
        <TimeTracker />
        {!session && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            You are currently browsing as a guest. Your time tracking data will not be saved unless you log in.
          </p>
        )}
      </div>
    </div>
  );
}