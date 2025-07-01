"use client";

import React from "react"; // Removed useState, useEffect as they are no longer needed for sidebar collapse
import { Header } from "@/components/header";
import { FloatingOverviewTab } from "@/components/floating-overview-tab";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Removed isSidebarCollapsed state and toggleSidebarCollapse function

  return (
    <div className="flex min-h-screen w-full">
      {/* Removed the entire aside element that contained the old Sidebar component */}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <Header /> {/* Removed toggleSidebarCollapse and isSidebarCollapsed props */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-background">
          {children}
        </main>
      </div>
      {/* The new floating overview tab remains */}
      <FloatingOverviewTab />
    </div>
  );
}