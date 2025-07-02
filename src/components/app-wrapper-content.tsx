"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import { useWidget } from "@/components/widget/widget-context"; // Corrected import path

export function AppWrapperContent({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { activeWidgets } = useWidget(); // Changed from isWidgetOpen to activeWidgets as per widget-context

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar still rendered here, controlled by AppWrapperContent */}
      <Sidebar /> {/* Sidebar now manages its own open state via context */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header no longer receives sidebar props */}
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}