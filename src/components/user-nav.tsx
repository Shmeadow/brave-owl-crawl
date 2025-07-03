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
import { useSupabase, UserProfile } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSidebarPreference } from "@/hooks/use-sidebar-preference";
import { useTheme } from "next-themes"; // Import useTheme

export function UserNav() {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const { isAlwaysOpen, toggleAlwaysOpen } = useSidebarPreference();
  const { theme, setTheme, themes } = useTheme(); // Removed 'mounted'
  const router = useRouter();

  const handleSignOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error signing out: " + error.message);
        console.error("Error signing out:", error);
      } else {
        toast.success("Signed out successfully!");
        router.push('/login');
      }
    }
  };

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
      <DropdownMenuContent className="w-56 z-[1001] bg-popover/80 backdrop-blur-lg" align="end" forceMount>
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
        <DropdownMenuSeparator />
        {/* Theme options removed from here */}
        <DropdownMenuItem className="p-0">
          <div className="flex items-center justify-between px-2 py-1.5 w-full">
            <Label htmlFor="sidebar-toggle" className="cursor-pointer text-sm font-normal">
              Always Open Sidebar
            </Label>
            <Switch
              id="sidebar-toggle"
              checked={isAlwaysOpen}
              onCheckedChange={toggleAlwaysOpen}
              className="ml-2"
            />
          </div>
        </DropdownMenuItem>
        {session && (
          <DropdownMenuItem onClick={handleSignOut}>
            Log out
          </DropdownMenuItem>
        )}
        {!session && (
          <DropdownMenuItem onClick={() => router.push('/login')}>
            Log in
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}