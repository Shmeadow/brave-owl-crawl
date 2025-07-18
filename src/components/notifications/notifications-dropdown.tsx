"use client";

import React, { useEffect } from "react";
import { Bell, Trash2, UserPlus, Check, X } from "lucide-react"; // Import UserPlus, Check, X
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
import { useRooms } from "@/hooks/use-rooms"; // Import useRooms
import { cn } from "@/lib/utils";

interface NotificationsDropdownProps {
  isModal?: boolean; // New prop to indicate if it's rendered inside a modal
}

export function NotificationsDropdown({ isModal = false }: NotificationsDropdownProps) {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteReadNotifications, handleDeleteNotification } = useNotifications();
  const { pendingRequests, acceptRequest, declineRequest, dismissRequest } = useRooms(); // Use useRooms for requests

  const hasReadNotifications = notifications.some(n => n.is_read);
  const totalUnreadCount = unreadCount + pendingRequests.length; // Combine unread counts

  const content = (
    <>
      {!isModal && ( // Only show label and separator if not in modal
        <>
          <DropdownMenuLabel>Notifications ({totalUnreadCount} unread)</DropdownMenuLabel>
          <DropdownMenuSeparator />
        </>
      )}
      
      <ScrollArea className={cn("h-48", isModal && "h-full")}> {/* Adjust height for modal */}
        {loading && pendingRequests.length === 0 && notifications.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground text-center">Loading notifications...</p>
        ) : (
          <>
            {/* Room Join Requests */}
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col p-2 bg-accent/50 border-b border-border/50 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Join Request</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => dismissRequest(request)} title="Dismiss request">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  <span className="font-medium text-primary">{request.profiles?.first_name || request.profiles?.last_name || `User (${request.requester_id.substring(0, 8)}...)`}</span> wants to join &quot;{request.rooms?.name || request.room_id.substring(0, 8) + '...'}&quot;.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => acceptRequest(request)} className="flex-1 h-7 text-xs">
                    <Check className="mr-1 h-3 w-3" /> Accept
                  </Button>
                  <Button onClick={() => declineRequest(request)} variant="outline" className="flex-1 h-7 text-xs">
                    <X className="mr-1 h-3 w-3" /> Decline
                  </Button>
                </div>
              </div>
            ))}

            {/* General Notifications */}
            {notifications.length === 0 && pendingRequests.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground text-center">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-center justify-between p-2 border-b border-border/50 last:border-b-0",
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
          </>
        )}
      </ScrollArea>
      {!isModal && <DropdownMenuSeparator />}
      <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
        Mark all as read
      </DropdownMenuItem>
      <DropdownMenuItem onClick={deleteReadNotifications} disabled={!hasReadNotifications} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        <span>Delete Read</span>
      </DropdownMenuItem>
    </>
  );

  if (isModal) {
    return content; // Render content directly if it's a modal
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title="Notifications" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          <span className="sr-only">Notifications</span>
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {totalUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 z-[1003] bg-popover/80 backdrop-blur-lg" align="end" forceMount>
        {content}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}