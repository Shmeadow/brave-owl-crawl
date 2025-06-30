"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Clock, LayoutDashboard, Goal, BookOpen, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Overview
          </h2>
          <div className="space-y-1">
            <Link href="/">
              <Button variant={isActive("/") ? "secondary" : "ghost"} className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/time-tracker">
              <Button variant={isActive("/time-tracker") ? "secondary" : "ghost"} className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Time Tracker
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              Flash Cards
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Goal className="mr-2 h-4 w-4" />
              Goal Focus
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Tools
          </h2>
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start">
              <Clock className="mr-2 h-4 w-4" />
              Pomodoro
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Dev Tools
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}