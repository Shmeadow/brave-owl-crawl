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
import { useEffect, useState } from "react";

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: string | null;
}

export function UserNav() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session && supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, profile_image_url, role')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error("Error fetching user profile for UserNav:", error);
          setProfile(null);
        } else if (data) {
          setProfile(data as UserProfile);
        } else {
          // If no profile found, create a default one (should ideally be handled on signup)
          // For robustness, we'll ensure a basic profile exists here if not found
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: session.user.id, first_name: null, last_name: null, profile_image_url: null, role: 'user' })
            .select('first_name, last_name, profile_image_url, role')
            .single();
          if (insertError) {
            console.error("Error creating default profile in UserNav:", insertError);
          } else if (newProfile) {
            setProfile(newProfile as UserProfile);
          }
        }
      } else {
        setProfile(null);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [session, supabase, authLoading]);

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