"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { PomodoroTimer } from "@/components/pomodoro-timer";
import { useSupabase } from "@/integrations/supabase/auth";

export default function PomodoroPage() {
  const { session } = useSupabase();
  return (
    <DashboardLayout className="flex flex-col items-center justify-center py-8">
      <PomodoroTimer />
      {!session && (
        <p className="text-sm text-muted-foreground mt-4">
          Log in to save your Pomodoro settings and history.
        </p>
      )}
    </DashboardLayout>
  );
}