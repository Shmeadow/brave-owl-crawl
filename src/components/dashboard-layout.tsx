"use client";

import React from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-transparent pt-[80px] pb-80 mx-auto max-w-7xl w-full"> {/* Adjusted pt for fixed header */}
          {children}
        </main>
      </div>
    </div>
  );
}