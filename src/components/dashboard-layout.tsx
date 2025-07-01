"use client";

import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // This component is now primarily a wrapper for pages that don't need the full
  // two-column layout or main tabs, but still want the global AppWrapper context.
  // The main layout (header, tabs, resizable panels) is handled in app/page.tsx.
  return (
    <div className="flex flex-col flex-1 w-full h-full">
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto pb-80 mx-auto max-w-7xl w-full">
        {children}
      </main>
    </div>
  );
}