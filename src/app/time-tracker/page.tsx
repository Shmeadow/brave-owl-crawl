"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { TimeTracker } from "@/components/time-tracker";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TimeTrackerPage() {
  const { session } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  if (!session) {
    return null; // Or a loading spinner
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-full py-8">
        <TimeTracker />
      </div>
    </DashboardLayout>
  );
}