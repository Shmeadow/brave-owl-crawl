"use client";

import { useEffect, useState } from "react";

export default function HomePage() {
  // The actual widgets are managed by WidgetContainer and opened via the sidebar.
  // This page serves as the main content area/background for the widgets.

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
        Welcome back!
      </h1>
      <p className="text-lg text-muted-foreground text-center">
        Use the sidebar on the left to open and manage your productivity widgets.
      </p>
    </div>
  );
}