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
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserNav() {
  const { supabase, session } = useSupabase();
  const router = useRouter();

  const handleSignOut = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Error signing out: " + error.message);
        console.error("Error signing out:", error);
      } else {
        toast.success("Signed out successfully!");
        router.push('/account'); // Redirect to account/login page after sign out
      }
    }
  };

  const userEmail = session?.user?.email;
  const userInitials = userEmail ? userEmail.charAt(0).toUpperCase() : "G"; // 'G' for Guest

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.user_metadata?.avatar_url} alt={userEmail || "Guest"} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {userEmail || "Guest User"}
            </p>
            {userEmail && (
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
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