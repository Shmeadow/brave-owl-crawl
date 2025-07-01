"use client";

import React from "react";
import { Header } from "@/components/header";
// Removed FloatingOverviewTab as it's being replaced

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto bg-background">
          {children}
        </main>
      </div>
      {/* The new main navigation is now part of the Header */}
    </div>
  );
}