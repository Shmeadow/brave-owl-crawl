"use client";

import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LayoutDashboard, Clock, BookOpen, Timer, Goal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function FloatingOverviewTab() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <TooltipProvider>
      <Sheet>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
              >
                <LayoutDashboard className="h-5 w-5" />
                <span className="sr-only">Open Overview</span>
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent side="left">
            Quick Overview
          </TooltipContent>
        </Tooltip>
        <SheetContent side="right" className="w-64 p-4 flex flex-col border-none">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Quick Overview</h2>
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
            <Link href="/flash-cards">
              <Button variant={isActive("/flash-cards") ? "secondary" : "ghost"} className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Flash Cards
              </Button>
            </Link>
            <Link href="/pomodoro">
              <Button variant={isActive("/pomodoro") ? "secondary" : "ghost"} className="w-full justify-start">
                <Timer className="mr-2 h-4 w-4" />
                Pomodoro
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start">
              <Goal className="mr-2 h-4 w-4" />
              Goal Focus
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}