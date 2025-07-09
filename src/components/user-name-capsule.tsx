"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function UserNameCapsule() {
  const { profile, loading } = useSupabase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-8 w-24 bg-muted/50 rounded-full px-3 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const displayName = profile?.first_name || profile?.last_name || profile?.id?.substring(0, 8) || "Guest";

  return (
    <div className={cn(
      "bg-muted/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground",
      "flex items-center justify-center transition-all duration-300 ease-in-out"
    )}>
      {displayName}
    </div>
  );
}