"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, Clock, BookOpen, Timer, Goal, User } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MainNavigation } from "@/components/main-navigation"; // New import

export function Header() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* Mobile Sheet Trigger and App Title */}
      <div className="flex items-center gap-4">
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
              {/* Mobile Nav Links */}
              <Link href="/" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/") && "text-primary")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
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
              <Link href="/account" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/account") && "text-primary")}>
                <User className="h-4 w-4" />
                Account
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        {/* App title for desktop, hidden on mobile when sheet is open */}
        <Link href="/" className="hidden sm:flex items-center gap-2 text-lg font-semibold">
          <LayoutDashboard className="h-6 w-6" />
          <span>Productivity App</span>
        </Link>
      </div>

      {/* Desktop Navigation (MainNavigation component) */}
      <div className="hidden sm:flex flex-1 justify-center">
        <MainNavigation />
      </div>

      {/* Right side: ThemeToggle and UserNav */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}