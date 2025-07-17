"use client";

import { useSupabase } from "@/integrations/supabase/auth";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";
import { useGuestIdentity } from "@/hooks/use-guest-identity";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  let idToCopy: string | null = null;

  if (profile?.first_name) {
    displayName = profile.first_name;
    idToCopy = session?.user?.id || null;
  } else if (session?.user?.id) {
    displayName = `${session.user.id.substring(0, 6)}...`;
    idToCopy = session.user.id;
  } else {
    displayName = guestId ? `${guestId.split('-')[1]}` : "Guest";
    idToCopy = guestId;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      toast.success("ID copied to clipboard!");
    } else {
      toast.error("No ID to copy.");
    }
  };

  return (
    <div className={cn(
      "bg-muted/50 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 text-sm font-medium text-foreground",
      "flex items-center justify-center transition-all duration-300 ease-in-out gap-2"
    )}>
      <span>{displayName}</span>
      {idToCopy && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          title="Copy ID"
        >
          <Copy className="h-3 w-3" />
          <span className="sr-only">Copy ID</span>
        </Button>
      )}
    </div>
  );
}