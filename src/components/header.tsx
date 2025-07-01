"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Users, Video, Image, Star, Settings, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { ClockDisplay } from "@/components/clock-display";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
// Progress component removed from here

interface HeaderProps {
  onTogglePomodoroVisibility: () => void;
  isPomodoroVisible: boolean;
  onOpenSpotifyModal: () => void;
  onOpenUpgradeModal: () => void;
  dailyProgress: number; // Add dailyProgress prop
}

export function Header({ onTogglePomodoroVisibility, isPomodoroVisible, onOpenSpotifyModal, onOpenUpgradeModal, dailyProgress }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-4 sm:px-6 bg-background/80 backdrop-blur-md border-b border-border">
      {/* Left Section: Logo/Badge */}
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Mobile Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs bg-background/90 backdrop-blur-md">
            <nav className="grid gap-6 text-lg font-medium pt-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <Sparkles className="h-6 w-6 text-primary" />
                <span>Focus 2</span>
              </Link>
              <Button variant="ghost" className="justify-start gap-3">
                <Users className="h-4 w-4" /> Invite
              </Button>
              <Button variant="ghost" className="justify-start gap-3">
                <Video className="h-4 w-4" /> Videos
              </Button>
              <Button variant="ghost" className="justify-start gap-3">
                <Image className="h-4 w-4" /> Images
              </Button>
              <Button variant="ghost" className="justify-start gap-3">
                <Star className="h-4 w-4" /> Favorites
              </Button>
              <Button variant="ghost" className="justify-start gap-3">
                <Settings className="h-4 w-4" /> Upgrade Desktop App
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Focus 2</span>
        </Link>
      </div>

      {/* Center Section: Title and Secondary Controls */}
      <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4">
        <h1 className="text-xl font-bold text-foreground whitespace-nowrap hidden md:block">Shmeadow's Room</h1>
        {/* Daily Progress bar moved to ClockDisplay */}
      </div>

      {/* Right Section: Search and User Controls */}
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search space..."
            className="pl-8 w-[200px] lg:w-[300px] bg-card/50 border-border focus:border-primary"
          />
        </div>
        <ClockDisplay dailyProgress={dailyProgress} /> {/* Pass dailyProgress here */}
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}