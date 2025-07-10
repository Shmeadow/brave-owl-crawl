"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { User, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UserNameCapsule() {
  const { session, supabase } = useSupabase();
  const user = session?.user;
  const userEmail = user?.email;
  const userId = user?.id; // Get the user's ID
  const userName = user?.user_metadata?.first_name || user?.user_metadata?.full_name || userEmail?.split('@')[0];

  const handleSignOut = async () => {
    if (!supabase) {
      toast.error("Supabase client not initialized.");
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out: " + error.message);
    } else {
      toast.success("Signed out successfully!");
    }
  };

  const handleCopyUserId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      toast.success("Your User ID copied to clipboard!");
    }
  };

  return (
    <div className={cn(
      "bg-muted/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground",
      "flex items-center justify-center transition-all duration-300 ease-in-out"
    )}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-0 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span>{userName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>User Info</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {userEmail && <DropdownMenuItem className="text-xs text-muted-foreground">{userEmail}</DropdownMenuItem>}
          {userId && (
            <DropdownMenuItem className="flex items-center justify-between text-xs text-muted-foreground">
              <span>ID: {userId.substring(0, 8)}...</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-2 text-muted-foreground hover:bg-muted/20"
                onClick={handleCopyUserId}
                title="Copy User ID"
              >
                <Copy className="h-3 w-3" />
                <span className="sr-only">Copy User ID</span>
              </Button>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}