"use client"; // Make this a client component to use useRouter

import { DashboardLayout } from "@/components/dashboard-layout";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { session, loading } = useSupabase(); // Get loading state
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) { // Only redirect if not loading and no session
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) { // Show loading state while session is being fetched
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading application...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Should be caught by useEffect redirect, but as a fallback
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="text-2xl font-bold">Welcome to your Productivity Hub!</h1>
        <p className="text-muted-foreground">
          Use the sidebar to navigate between your tools.
        </p>
      </div>
      <MadeWithDyad />
    </DashboardLayout>
  );
}