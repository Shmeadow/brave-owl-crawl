"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { useSupabase } from "@/integrations/supabase/auth";

export default function PomodoroPage() {
  const { session, loading } = useSupabase();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full py-8">
          <p>Loading pomodoro timer...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full py-8">
        <PomodoroTimer />
        {!session && (
          <p className="text-sm text-muted-foreground mt-4">
            You are currently browsing as a guest. Pomodoro progress will not be saved unless you log in.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}