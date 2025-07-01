"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, Clock, BookOpen, Goal, User, Settings, Music, Timer } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MainNavigation } from "@/components/main-navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { ClockDisplay } from "@/components/clock-display"; // Import ClockDisplay
import { UpgradeButton } from "@/components/upgrade-button"; // Import UpgradeButton

interface HeaderProps {
  onTogglePomodoroVisibility: () => void;
  isPomodoroVisible: boolean;
  onOpenSpotifyModal: () => void;
  onOpenUpgradeModal: () => void; // New prop for upgrade modal
}

export function Header({ onTogglePomodoroVisibility, isPomodoroVisible, onOpenSpotifyModal, onOpenUpgradeModal }: HeaderProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const { session, loading, profile } = useSupabase(); // Get profile from context
  const isAdmin = profile?.role === 'admin'; // Use profile.role for admin check
  const isPremium = profile?.is_premium || false; // Get premium status

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* Left side: Mobile Sheet Trigger, App Title, and Desktop Navigation */}
      <div className="flex items-center gap-4 sm:gap-6">
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
              <Link href="/time-tracker" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/time-tracker") && "text-primary")}>
                <Clock className="h-4 w-4" />
                Time Tracker
              </Link>
              <Link href="/flash-cards" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/flash-cards") && "text-primary")}>
                <BookOpen className="h-4 w-4" />
                Flash Cards
              </Link>
              <Link href="/goal-focus" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/goal-focus") && "text-primary")}>
                <Goal className="h-4 w-4" />
                Goal Focus
              </Link>
              <Link href="/account" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/account") && "text-primary")}>
                <User className="h-4 w-4" />
                Account
              </Link>
              {isAdmin && (
                <Link href="/admin-settings" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary", isActive("/admin-settings") && "text-primary")}>
                  <Settings className="h-4 w-4" />
                  Admin Settings
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        {/* App title for desktop */}
        <Link href="/" className="hidden sm:flex items-center gap-2 text-lg font-semibold">
          <LayoutDashboard className="h-6 w-6" />
          <span>Productivity App</span>
        </Link>
        {/* Desktop Navigation (MainNavigation component) - now part of the left group */}
        <MainNavigation />
        <ClockDisplay /> {/* Add ClockDisplay here */}
      </div>

      {/* Right side: ThemeToggle and UserNav */}
      <div className="flex items-center gap-4 ml-auto">
        <UpgradeButton onOpenUpgradeModal={onOpenUpgradeModal} isPremium={isPremium} /> {/* Add UpgradeButton */}
        <Button variant="ghost" size="icon" onClick={onOpenSpotifyModal} title="Open Spotify Embed">
          <Music className="h-5 w-5" />
          <span className="sr-only">Open Spotify Embed</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onTogglePomodoroVisibility} title={isPomodoroVisible ? "Hide Pomodoro Timer" : "Show Pomodoro Timer"}>
          <Timer className="h-5 w-5" />
          <span className="sr-only">{isPomodoroVisible ? "Hide Pomodoro Timer" : "Show Pomodoro Timer"}</span>
        </Button>
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}