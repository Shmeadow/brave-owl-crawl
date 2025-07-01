"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LayoutDashboard, Clock, BookOpen, Goal, User, Settings, Music, Timer, Search, Share2 } from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MainNavigation } from "@/components/main-navigation";
import { useSupabase } from "@/integrations/supabase/auth";
import { ClockDisplay } from "@/components/clock-display";
import { UpgradeButton } from "@/components/upgrade-button";
import { Input } from "@/components/ui/input"; // Import Input for search bar

interface HeaderProps {
  onTogglePomodoroVisibility: () => void;
  isPomodoroVisible: boolean;
  onOpenSpotifyModal: () => void;
  onOpenUpgradeModal: () => void;
}

export function Header({ onTogglePomodoroVisibility, isPomodoroVisible, onOpenSpotifyModal, onOpenUpgradeModal }: HeaderProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const { session, loading, profile } = useSupabase();
  const isAdmin = profile?.role === 'admin';
  const isPremium = profile?.is_premium || false;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Productivity Hub',
        text: 'Check out this awesome productivity app!',
        url: window.location.href,
      }).then(() => {
        console.log('Thanks for sharing!');
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] flex items-center justify-between px-4 sm:px-6 z-[200] backdrop-blur-md bg-black/30 border-b border-white/10">
      {/* Left side: Logo/Title and Mobile Sheet Trigger */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="sm:hidden text-white/80 hover:text-white">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs bg-black/70 backdrop-blur-md border-r border-white/10 text-white">
            <nav className="grid gap-6 text-lg font-medium">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
                <LayoutDashboard className="h-6 w-6" />
                <span>YourSpace</span>
              </Link>
              {/* Mobile Nav Links */}
              <Link href="/time-tracker" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-white hover:bg-white/10", isActive("/time-tracker") && "text-white bg-white/10")}>
                <Clock className="h-4 w-4" />
                Time Tracker
              </Link>
              <Link href="/flash-cards" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-white hover:bg-white/10", isActive("/flash-cards") && "text-white bg-white/10")}>
                <BookOpen className="h-4 w-4" />
                Flash Cards
              </Link>
              <Link href="/goal-focus" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-white hover:bg-white/10", isActive("/goal-focus") && "text-white bg-white/10")}>
                <Goal className="h-4 w-4" />
                Goal Focus
              </Link>
              <Link href="/account" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-white hover:bg-white/10", isActive("/account") && "text-white bg-white/10")}>
                <User className="h-4 w-4" />
                Account
              </Link>
              {isAdmin && (
                <Link href="/admin-settings" className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-white hover:bg-white/10", isActive("/admin-settings") && "text-white bg-white/10")}>
                  <Settings className="h-4 w-4" />
                  Admin Settings
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        {/* App title for desktop */}
        <Link href="/" className="hidden sm:flex items-center gap-2 text-lg font-semibold text-white tracking-wide transition-all duration-200 hover:scale-[1.02] hover:text-accent">
          <LayoutDashboard className="h-6 w-6" />
          <h1>YourSpace</h1>
        </Link>
        {/* Desktop Navigation (MainNavigation component) - now part of the left group */}
        <MainNavigation />
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 justify-center px-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            type="search"
            placeholder="Search spaces..."
            className="w-full pl-9 pr-3 py-2 rounded-md border-none bg-white/10 text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary focus:bg-white/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right side: Icon Buttons, Clock, ThemeToggle and UserNav */}
      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <ClockDisplay /> {/* Add ClockDisplay here */}
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-accent transition-all duration-200" onClick={onOpenSpotifyModal} title="Open Spotify Embed">
          <Music className="h-5 w-5" />
          <span className="sr-only">Open Spotify Embed</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-accent transition-all duration-200" onClick={onTogglePomodoroVisibility} title={isPomodoroVisible ? "Hide Pomodoro Timer" : "Show Pomodoro Timer"}>
          <Timer className="h-5 w-5" />
          <span className="sr-only">{isPomodoroVisible ? "Hide Pomodoro Timer" : "Show Pomodoro Timer"}</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-accent transition-all duration-200" onClick={handleShare} title="Invite / Share">
          <Share2 className="h-5 w-5" />
          <span className="sr-only">Invite / Share</span>
        </Button>
        <ThemeToggle />
        <UpgradeButton onOpenUpgradeModal={onOpenUpgradeModal} isPremium={isPremium} />
        <UserNav />
      </div>
    </header>
  );
}