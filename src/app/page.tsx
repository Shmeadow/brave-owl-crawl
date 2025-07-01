"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
// Removed useSidebar and panel imports as they are now handled by widgets
// Removed AnimatePresence and motion as widgets manage their own animations

export default function HomePage() {
  // The activePanel logic and direct panel rendering are now handled by the Widget system.
  // This page now serves as the main content area for the application,
  // where widgets will float on top.

  return (
    <div className="flex flex-col min-h-screen w-full pt-16">
      <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
        {/* This is the main content area. Widgets will float above this. */}
        <div className="text-center text-foreground text-xl font-semibold">
          Welcome to your Productivity Hub!
          <p className="text-muted-foreground text-sm mt-2">Use the sidebar to open your tools.</p>
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
}