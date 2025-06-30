"use client"; // Make this a client component to use useRouter

import { DashboardLayout } from "@/components/dashboard-layout";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
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