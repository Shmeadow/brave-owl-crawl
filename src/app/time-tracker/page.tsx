"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TimeTracker } from "@/components/time-tracker";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TimeTrackerPage() {
  // Removed mandatory redirect. User can now access this page without logging in.
  const { session, loading } = useSupabase();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full py-8">
          <p>Loading time tracker...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full py-8">
        <TimeTracker />
        {!session && (
          <p className="text-sm text-muted-foreground mt-4">
            You are currently browsing as a guest. Your time tracking data will not be saved unless you log in.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}