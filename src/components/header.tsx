"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Users, Video, Image, Star, Settings, Menu, Music, Clock, LayoutGrid, Calendar, ListTodo, NotebookPen, Wind, BookOpen, Goal } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { ClockDisplay } from "@/components/clock-display";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/sidebar/sidebar-context"; // Import useSidebar

interface HeaderProps {
  onTogglePomodoroVisibility: () => void;
  isPomodoroVisible: boolean;
  onOpenSpotifyModal: () => void;
}

export function Header({ onTogglePomodoroVisibility, isPomodoroVisible, onOpenSpotifyModal }: HeaderProps) {
  const { setActivePanel } = useSidebar(); // Get setActivePanel from context

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
              <div className="grid gap-2">
                {/* Mobile navigation for main panels */}
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('spaces')}>
                  <LayoutGrid className="h-4 w-4" /> Spaces
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('sounds')}>
                  <Music className="h-4 w-4" /> Sounds
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('calendar')}>
                  <Calendar className="h-4 w-4" /> Calendar
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('timer')}>
                  <Clock className="h-4 w-4" /> Timer
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('tasks')}>
                  <ListTodo className="h-4 w-4" /> Tasks
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('notes')}>
                  <NotebookPen className="h-4 w-4" /> Notes
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('media')}>
                  <Image className="h-4 w-4" /> Media
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('fortune')}>
                  <Sparkles className="h-4 w-4" /> Fortune
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('breathe')}>
                  <Wind className="h-4 w-4" /> Breathe
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('flash-cards')}>
                  <BookOpen className="h-4 w-4" /> Flash Cards
                </Button>
                <Button variant="ghost" className="justify-start gap-3" onClick={() => setActivePanel('goal-focus')}>
                  <Goal className="h-4 w-4" /> Goal Focus
                </Button>
                {/* Existing mobile menu items */}
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
              </div>
              <div className="mt-4 border-t pt-4">
                <ThemeToggle />
                <Button variant="ghost" className="justify-start gap-3 mt-2" onClick={onOpenSpotifyModal}>
                  <Music className="h-4 w-4" /> Spotify Embed
                </Button>
                <Button variant="ghost" className="justify-start gap-3 mt-2" onClick={onTogglePomodoroVisibility}>
                  <Clock className="h-4 w-4" /> {isPomodoroVisible ? "Hide Timer" : "Show Timer"}
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Focus 2</span>
        </Link>
      </div>

      {/* Center Section: Title and Secondary Controls */}
      <div className="flex-1 flex items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-bold text-foreground whitespace-nowrap hidden md:block">Shmeadow's Room</h1>
        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Settings className="h-4 w-4 mr-1" /> Upgrade Desktop App
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Users className="h-4 w-4 mr-1" /> Invite
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Video className="h-4 w-4 mr-1" /> Videos
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Image className="h-4 w-4 mr-1" /> Images
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
            <Star className="h-4 w-4 mr-1" /> Favorites
          </Button>
        </div>
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
        <ClockDisplay />
        <Button variant="ghost" size="icon" onClick={onOpenSpotifyModal} title="Open Spotify Embed" className="hidden sm:flex">
          <Music className="h-5 w-5" />
          <span className="sr-only">Open Spotify Embed</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onTogglePomodoroVisibility} title={isPomodoroVisible ? "Hide Pomodoro Timer" : "Show Pomodoro Timer"} className="hidden sm:flex">
          <Clock className="h-5 w-5" />
          <span className="sr-only">{isPomodoroVisible ? "Hide Pomodoro Timer" : "Show Pomodoro Timer"}</span>
        </Button>
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}