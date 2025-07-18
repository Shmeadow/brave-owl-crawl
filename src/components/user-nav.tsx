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
import { useTheme } from "next-themes";
import { BackgroundBlurSlider } from "./background-blur-slider";
import { cn } from "@/lib/utils";
import React, { useState } from 'react'; // Import useState
import { Bug } from 'lucide-react'; // Import Bug icon
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGuestIdentity } from '@/hooks/use-guest-identity';

// Define schema for bug report form
const bugReportSchema = z.object({
  report: z.string().min(10, { message: 'Please provide at least 10 characters.' }),
});

// Helper component for the bug report menu item
function BugReportMenuItem() {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { session } = useSupabase();
  const { guestId } = useGuestIdentity();

  const form = useForm<z.infer<typeof bugReportSchema>>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: {
      report: '',
    },
  });

  const onSubmit = (values: z.infer<typeof bugReportSchema>) => {
    const userIdentifier = session ? `User ID: ${session.user.id}` : `Guest ID: ${guestId}`;
    const userAgent = navigator.userAgent;
    const body = encodeURIComponent(
      `Bug Report:\n${values.report}\n\n---\n${userIdentifier}\nBrowser: ${userAgent}`
    );
    const subject = encodeURIComponent('CozyHub Bug Report');
    
    window.location.href = `mailto:support@cozyhub.app?subject=${subject}&body=${body}`;
    
    toast.info("Opening your email client to send the report.");
    form.reset();
    setIsPopoverOpen(false);
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        {/* Prevent DropdownMenuItem from closing the whole dropdown immediately */}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Bug className="mr-2 h-4 w-4" />
          <span>Submit a Bug</span>
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent className="w-80 z-[1100]" align="end">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Submit a Bug Report</h4>
            <p className="text-sm text-muted-foreground">
              Describe the issue you're encountering.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bug-report-textarea">Description</Label>
            <Textarea
              id="bug-report-textarea"
              placeholder="What went wrong?"
              {...form.register('report')}
              className="min-h-[100px]"
            />
            {form.formState.errors.report && (
              <p className="text-xs text-destructive">{form.formState.errors.report.message}</p>
            )}
          </div>
          <Button type="submit">Send Report</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

interface UserNavProps {
  isMobile: boolean; // New prop
}

export function UserNav({ isMobile }: UserNavProps) {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const { theme, setTheme, themes } = useTheme();
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
        <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="Open user menu">
          <Avatar className="h-7 w-7">
            <AvatarImage src={displayImage || undefined} alt={displayName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-[1003] bg-popover/80 backdrop-blur-lg" align="end" forceMount>
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
        {isMobile && (
          <>
            <DropdownMenuItem className="flex items-center justify-between">
              <span className="text-sm">Background Blur</span>
              <BackgroundBlurSlider className="mobile-only w-24" isMobile={true} />
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <BugReportMenuItem /> {/* Render the new bug report menu item */}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => router.push('/account')}>
          Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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