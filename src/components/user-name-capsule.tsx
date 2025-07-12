"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { Loader2, Copy } from "lucide-react"; // Import Copy icon
import { toast } from "sonner"; // Import toast

export function UserNameCapsule() {
  const { profile, session, loading } = useSupabase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-8 w-24 bg-muted/50 rounded-full px-3 py-1 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const displayCode = profile?.display_code;

  const handleCopyDisplayCode = () => {
    if (displayCode) {
      navigator.clipboard.writeText(displayCode);
      toast.success("Your Unique ID copied to clipboard!");
    } else {
      toast.error("No Unique ID available to copy.");
    }
  };

  return (
    <div className={cn(
      "bg-muted/50 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground",
      "flex items-center justify-center transition-all duration-300 ease-in-out"
    )}>
      {displayCode || '...'}
      {displayCode && (
        <button
          onClick={handleCopyDisplayCode}
          className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors"
          title="Copy Your Unique ID"
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
          <span className="sr-only">Copy Unique ID</span>
        </button>
      )}
    </div>
  );
}