"use client";

import React from "react";
// Removed FloatingOverviewTab as it's being replaced
// Removed Header import as it's now in AppWrapper

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex flex-1 flex-col">
        {/* Header is now rendered in AppWrapper */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-background pb-80 mx-auto max-w-7xl w-full"> {/* Increased pb-32 to pb-80, added mx-auto max-w-7xl w-full */}
          {children}
        </main>
      </div>
      {/* The new main navigation is now part of the Header */}
    </div>
  );
}