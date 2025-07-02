"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export function UserNav() {
  const { supabase, session, profile } = useSupabase();
  const router = useRouter();
  const [sidebarAlwaysOpen, setSidebarAlwaysOpen] = useState(false);

  useEffect(() => {
    // Load preference from local storage
    const storedPreference = localStorage.getItem('sidebarAlwaysOpen');
    if (storedPreference !== null) {
      setSidebarAlwaysOpen(JSON.parse(storedPreference));
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSidebarToggle = (checked: boolean) => {
    setSidebarAlwaysOpen(checked);
    localStorage.setItem('sidebarAlwaysOpen', JSON.stringify(checked));
    // You might want to dispatch an event or use a context to inform the sidebar
    // For now, this relies on the sidebar component reading this localStorage value.
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.profile_image_url || "/avatars/03.png"} alt={profile?.first_name || "User"} />
            <AvatarFallback>{profile?.first_name ? profile.first_name[0] : "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-[1001]" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{profile?.first_name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session?.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Billing</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>New Team</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center justify-between">
          <Label htmlFor="sidebar-toggle">Always Open Sidebar</Label>
          <Switch
            id="sidebar-toggle"
            checked={sidebarAlwaysOpen}
            onCheckedChange={handleSidebarToggle}
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}