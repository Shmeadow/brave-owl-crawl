"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  // Removed mandatory redirect. User can now access this page without logging in.
  // The session and loading states are still available via useSupabase if needed for conditional rendering.
  const { session, loading } = useSupabase();

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Welcome to your Productivity Hub!</h1>
        <p className="text-muted-foreground">
          Use the sidebar to navigate between your tools.
        </p>
        {!loading && !session && (
          <p className="text-sm text-muted-foreground">
            You are currently browsing as a guest. Some features may require you to log in.
          </p>
        )}
      </div>
      <MadeWithDyad />
    </DashboardLayout>
  );
}