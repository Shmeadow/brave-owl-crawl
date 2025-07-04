"use client";

import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NotificationsDropdownProps {
  unreadCount: number;
  onClearUnread: () => void;
  onNewUnread: () => void;
}

export function NotificationsDropdown({ unreadCount, onClearUnread, onNewUnread }: NotificationsDropdownProps) {
  // This is a placeholder component.
  // In a real implementation, you would fetch notifications from a backend
  // and manage their read/unread status.

  const notifications = [
    { id: "1", message: "Welcome to Productivity Hub!", read: true },
    { id: "2", message: "New feature: Flashcards are here!", read: false },
    { id: "3", message: "Your daily goals summary is ready.", read: true },
  ];

  const hasUnread = notifications.some(n => !n.read) || unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Notifications" className="relative">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {/* This dot indicates unread notifications, actual count can be shown in chat icon */}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 z-[1003] bg-popover/80 backdrop-blur-lg" align="end" forceMount>
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-48">
          {notifications.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground text-center">No new notifications.</p>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-2">
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => alert("Mark all as read functionality would go here.")}>
          Mark all as read
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}