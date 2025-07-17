"use client";

import React, { useEffect } from "react";
import { Bell, Trash2 } from "lucide-react";
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
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

interface NotificationsDropdownProps {
}

export function NotificationsDropdown({}: NotificationsDropdownProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, addNotification, deleteReadNotifications, handleDeleteNotification } = useNotifications();

  const hasReadNotifications = notifications.some(n => n.is_read);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Notifications" className="relative">
          {/* Wrap children in a single span to satisfy React.Children.only */}
          <span className="flex items-center justify-center">
            <Bell className="h-6 w-6" />
            <span className="sr-only">Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 z-[1003] bg-popover/80 backdrop-blur-lg" align="end" forceMount>
        <DropdownMenuLabel>Notifications ({unreadCount} unread)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-48">
          {loading ? (
            <p className="p-2 text-sm text-muted-foreground text-center">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground text-center">No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-center justify-between p-2",
                  !notification.is_read ? "bg-accent/50" : "opacity-80"
                )}
              >
                <DropdownMenuItem
                  className="flex flex-col items-start flex-1 p-0 h-auto cursor-pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  <p className="text-sm font-medium">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </DropdownMenuItem>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={() => handleDeleteNotification(notification.id)}
                  title="Delete notification"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete notification</span>
                </Button>
              </div>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
          Mark all as read
        </DropdownMenuItem>
        <DropdownMenuItem onClick={deleteReadNotifications} disabled={!hasReadNotifications} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Read</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}