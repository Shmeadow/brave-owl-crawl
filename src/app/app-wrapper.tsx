"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { Toaster } from "@/components/ui/sonner";
import { LoadingScreen } from "@/components/loading-screen";
import { AmbientSoundProvider } from "@/context/ambient-sound-provider";
import { FocusSessionProvider } from "@/context/focus-session-provider";
import { checkAndClearClientData } from "@/lib/client-version";
import { MainAppLayout } from "@/components/main-app-layout";

export function AppWrapper({ children, initialWidgetConfigs }: { children: React.ReactNode; initialWidgetConfigs: any }) {
  const { loading } = useSupabase();
  const pathname = usePathname();

  useEffect(() => {
    checkAndClearClientData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (pathname === '/pricing' || pathname === '/login' || pathname === '/landing') {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <AmbientSoundProvider>
      <FocusSessionProvider>
        <MainAppLayout initialWidgetConfigs={initialWidgetConfigs}>
          {children}
        </MainAppLayout>
      </FocusSessionProvider>
    </AmbientSoundProvider>
  );
}