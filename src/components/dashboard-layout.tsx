"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('isSidebarCollapsed');
      return savedState === 'true';
    }
    return false; // Default to open
  });

  const toggleSidebarCollapse = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isSidebarCollapsed', String(newState));
    }
  };

  return (
    <div className="flex min-h-screen w-full"> {/* Main flex container */}
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden lg:block", // Only show on large screens
          "flex-shrink-0", // Prevent sidebar from shrinking
          "border-r bg-sidebar text-foreground", // Changed text-sidebar-foreground to text-foreground
          "transition-all duration-300 ease-in-out", // Animation
          isSidebarCollapsed ? "w-0 overflow-hidden" : "w-64", // Collapsed or expanded width
          "h-full" // Ensure sidebar takes full height
        )}
      >
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <Header toggleSidebarCollapse={toggleSidebarCollapse} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}