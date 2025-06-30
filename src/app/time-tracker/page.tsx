"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TimeTracker } from "@/components/time-tracker";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TimeTrackerPage() {
  const { session, loading } = useSupabase(); // Get loading state
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) { // Only redirect if not loading and no session
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) { // Show loading state while session is being fetched
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full py-8">
          <p>Loading time tracker...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null; // Should be caught by useEffect redirect, but as a fallback
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full py-8">
        <TimeTracker />
      </div>
    </DashboardLayout>
  );
}