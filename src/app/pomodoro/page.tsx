"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { useSupabase } from "@/integrations/supabase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer } from "lucide-react";

export default function PomodoroPage() {
  const { session } = useSupabase();
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center flex-1 py-8">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Pomodoro Timer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Timer className="h-16 w-16 text-primary" />
            <p className="text-muted-foreground">
              Your Pomodoro timer is now available as a persistent widget at the bottom of the screen.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the <span className="font-semibold">Timer icon</span> at the bottom to expand or minimize it.
            </p>
            {!session && (
              <p className="text-sm text-muted-foreground mt-4">
                Log in to save your Pomodoro settings and history.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}