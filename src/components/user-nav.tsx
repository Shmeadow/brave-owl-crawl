"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSupabase, UserProfile } from "@/integrations/supabase/auth"; // Import UserProfile
import { useRouter } from "next/navigation";
import { toast } from "sonner";
// No need for useEffect or useState for profile here, use directly from context

export function UserNav() {
  const { supabase, session, profile, loading: authLoading } = useSupabase(); // Get profile directly
  const router = useRouter();

  const handleSignOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error signing out: " + error.message);
        console.error("Error signing out:", error);
      } else {
        toast.success("Signed out successfully!");
        router.push('/account');
      }
    }
  };

  // Use profile directly from context
  const displayName = profile?.first_name || profile?.last_name || session?.user?.email || "Guest User";
  const displayEmail = session?.user?.email;
  const displayImage = profile?.profile_image_url || session?.user?.user_metadata?.avatar_url;
  const userInitials = (profile?.first_name?.charAt(0) || profile?.last_name?.charAt(0) || displayEmail?.charAt(0) || "G").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayImage || undefined} alt={displayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {displayName}
            </p>
            {displayEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {displayEmail}
              </p>
            )}
            {profile?.role && (
              <p className="text-xs leading-none text-muted-foreground capitalize">
                Role: {profile.role}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/account')}>
          Account
        </DropdownMenuItem>
        {session && (
          <DropdownMenuItem onClick={handleSignOut}>
            Log out
          </DropdownMenuItem>
        )}
        {!session && (
          <DropdownMenuItem onClick={() => router.push('/account')}>
            Log in
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}