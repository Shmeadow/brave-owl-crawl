"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border">
        <ResizablePanel
          defaultSize={isSidebarCollapsed ? 0 : 280} // Initial size based on state
          minSize={isSidebarCollapsed ? 0 : 15} // If collapsed, minSize is 0. If open, minSize is 15%
          maxSize={isSidebarCollapsed ? 0 : 30} // If collapsed, maxSize is 0. If open, maxSize is 30%
          collapsible={true}
          collapsedSize={0}
          onCollapse={() => {
            setIsSidebarCollapsed(true);
            if (typeof window !== 'undefined') localStorage.setItem('isSidebarCollapsed', 'true');
          }}
          onExpand={() => {
            setIsSidebarCollapsed(false);
            if (typeof window !== 'undefined') localStorage.setItem('isSidebarCollapsed', 'false');
          }}
          className={cn("hidden lg:block", isSidebarCollapsed && "min-w-0")}
        >
          <Sidebar />
        </ResizablePanel>
        {!isSidebarCollapsed && <ResizableHandle withHandle />}
        <ResizablePanel>
          <div className="flex flex-col">
            <Header toggleSidebarCollapse={toggleSidebarCollapse} isSidebarCollapsed={isSidebarCollapsed} />
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </main>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}