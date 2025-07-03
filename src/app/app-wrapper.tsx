"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { useSidebar } from "@/hooks/use-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar/sidebar";
import { LoginScreen } from "@/components/login-screen";
import { LoadingScreen } from "@/components/loading-screen";

export function AppWrapper({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSupabase();
  const pathname = usePathname();
  const { isExpanded, sidebarWidth, collapsedSidebarWidth } = useSidebar();
  const [sidebarCurrentWidth, setSidebarCurrentWidth] = useState(sidebarWidth);

  useEffect(() => {
    setSidebarCurrentWidth(isExpanded ? sidebarWidth : collapsedSidebarWidth);
  }, [isExpanded, sidebarWidth, collapsedSidebarWidth]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  // Don't render the main layout for the login page
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main
        className="flex flex-col flex-1 w-full overflow-auto transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarCurrentWidth}px` }}
      >
        <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        <Toaster />
      </main>
    </div>
  );
}