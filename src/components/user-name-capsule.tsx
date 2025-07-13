"use client";

import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useGuestIdentity } from "@/hooks/use-guest-identity";

export function UserNameCapsule() {
  const { profile, session, loading } = useSupabase();
  const { guestId } = useGuestIdentity();

  if (loading) {
    return (
      <div className={cn(
        "bg-muted/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground",
        "flex items-center justify-center transition-all duration-300 ease-in-out"
      )}>
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  let displayName: string;
  if (profile?.first_name) {
    displayName = profile.first_name;
  } else if (session?.user?.id) {
    displayName = `User (${session.user.id.substring(0, 6)}...)`;
  } else {
    displayName = guestId ? `Guest (${guestId.split('-')[1]})` : "Guest";
  }

  return (
    <div className={cn(
      "bg-muted/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground",
      "flex items-center justify-center transition-all duration-300 ease-in-out"
    )}>
      <User className="h-4 w-4 mr-2" />
      <span>{displayName}</span>
    </div>
  );
}