"use client";

import React from "react";
// Removed MadeWithDyad import as it's no longer needed

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen w-full pt-16">
      <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
        {/* This is the main content area. Widgets will float above this. */}
        <div className="text-center text-foreground text-xl font-semibold">
          Welcome to your Productivity Hub!
          <p className="text-muted-foreground text-sm mt-2">Use the sidebar to open your tools.</p>
        </div>
      </div>
      {/* Removed <MadeWithDyad /> */}
    </div>
  );
}