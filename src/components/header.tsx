"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, BookOpen, Timer, Goal } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  // Removed toggleSidebarCollapse and isSidebarCollapsed props
}

export function Header({}: HeaderProps) { // Removed props from destructuring
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
              <LayoutDashboard className="h-6 w-6" />
              <span>Productivity App</span>
            </Link>
            <Link href="/" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/") && "text-primary")}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/time-tracker" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/time-tracker") && "text-primary")}>
              <Clock className="h-4 w-4" />
              Time Tracker
            </Link>
            <Link href="/flash-cards" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/flash-cards") && "text-primary")}>
              <BookOpen className="h-4 w-4" />
              Flash Cards
            </Link>
            <Link href="/pomodoro" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/pomodoro") && "text-primary")}>
              <Timer className="h-4 w-4" />
              Pomodoro
            </Link>
            <Link href="/goal-focus" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/goal-focus") && "text-primary")}>
              <Goal className="h-4 w-4" />
              Goal Focus
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      {/* Removed the sidebar toggle button here */}
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search functionality can go here if needed */}
      </div>
      <ThemeToggle />
      <UserNav />
    </header>
  );
}