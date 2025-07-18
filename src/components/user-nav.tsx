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
import { Copy, Bell, Settings, BarChart2, Bug, Crown } from "lucide-react"; // Import new icons
import { useGuestIdentity } from "@/hooks/use-guest-identity";
import { RoomData } from "@/hooks/rooms/types";
import { RoomSettingsModal } from "./spaces-widget/RoomSettingsModal"; // New modal
import { NotificationsModal } from "./notifications/NotificationsModal"; // New modal
import { BugReportModal } from "./bug-report-modal"; // New modal

interface UserNavProps {
  isMobile: boolean;
  // Props for mobile-specific features
  unreadChatCount?: number;
  onToggleChat?: () => void;
  isRoomSettingsOpen?: boolean;
  setIsRoomSettingsOpen?: (isOpen: boolean) => void;
  userOwnsPersonalRoom?: boolean;
  usersPersonalRoom?: RoomData | null;
  handleRoomCreated?: (room: RoomData) => void;
  toggleWidget?: (id: string, title: string) => void;
  session?: ReturnType<typeof useSupabase>['session'];
  profile?: UserProfile | null;
  currentRoomId?: string | null;
  currentRoomName?: string;
  isCurrentRoomWritable?: boolean;
  isNotificationsOpen?: boolean;
  setIsNotificationsOpen?: (isOpen: boolean) => void;
  isBugReportOpen?: boolean;
  setIsBugReportOpen?: (isOpen: boolean) => void;
}

export function UserNav({
  isMobile,
  unreadChatCount,
  onToggleChat,
  isRoomSettingsOpen,
  setIsRoomSettingsOpen,
  userOwnsPersonalRoom,
  usersPersonalRoom,
  handleRoomCreated,
  toggleWidget,
  session: propSession, // Use propSession to avoid conflict with useSupabase session
  profile: propProfile, // Use propProfile to avoid conflict with useSupabase profile
  currentRoomId,
  currentRoomName,
  isCurrentRoomWritable,
  isNotificationsOpen,
  setIsNotificationsOpen,
  isBugReportOpen,
  setIsBugReportOpen,
}: UserNavProps) {
  const { supabase, session: contextSession, profile: contextProfile } = useSupabase();
  const session = propSession || contextSession;
  const profile = propProfile || contextProfile;

  const { guestId } = useGuestIdentity();
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

  let idToCopy: string | null = null;
  if (profile?.first_name) { // If logged in and has a first name, copy user ID
    idToCopy = session?.user?.id || null;
  } else if (session?.user?.id) { // If logged in but no first name, copy user ID
    idToCopy = session.user.id;
  } else { // Guest mode, copy guest ID
    idToCopy = guestId;
  }

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      toast.success("ID copied to clipboard!");
    } else {
      toast.error("No ID to copy.");
    }
  };

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
            {idToCopy && (
              <div className="flex items-center mt-1">
                <p className="text-xs text-muted-foreground">ID: {idToCopy.substring(0, 6)}...</p>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground hover:text-foreground" onClick={handleCopyId} title="Copy ID">
                  <Copy className="h-3 w-3" />
                  <span className="sr-only">Copy ID</span>
                </Button>
              </div>
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

            {/* Notifications */}
            {session && setIsNotificationsOpen && (
              <DropdownMenuItem onClick={() => setIsNotificationsOpen(true)}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {unreadChatCount && unreadChatCount > 0 && (
                  <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadChatCount}
                  </span>
                )}
              </DropdownMenuItem>
            )}

            {/* Room Settings */}
            {session && setIsRoomSettingsOpen && userOwnsPersonalRoom && usersPersonalRoom && (
              <DropdownMenuItem onClick={() => setIsRoomSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Room Settings
              </DropdownMenuItem>
            )}

            {/* Statistics */}
            {toggleWidget && (
              <DropdownMenuItem onClick={() => toggleWidget('stats-progress', 'Statistics')}>
                <BarChart2 className="mr-2 h-4 w-4" />
                Statistics
              </DropdownMenuItem>
            )}

            {/* Bug Report */}
            {setIsBugReportOpen && (
              <DropdownMenuItem onClick={() => setIsBugReportOpen(true)}>
                <Bug className="mr-2 h-4 w-4" />
                Bug Report
              </DropdownMenuItem>
            )}

            {/* Upgrade */}
            <DropdownMenuItem onClick={() => router.push('/pricing')}>
              <Crown className="mr-2 h-4 w-4 text-gold" />
              Upgrade
            </DropdownMenuItem>

            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => router.push('/account')}>
          Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {session ? (
          <DropdownMenuItem onClick={handleSignOut}>
            Log out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => router.push('/login')}>
            Log in
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>

      {/* Modals/Drawers for mobile-triggered features */}
      {isMobile && isNotificationsOpen && setIsNotificationsOpen && (
        <NotificationsModal isOpen={isNotificationsOpen} onOpenChange={setIsNotificationsOpen} />
      )}
      {isMobile && isRoomSettingsOpen && setIsRoomSettingsOpen && usersPersonalRoom && (
        <RoomSettingsModal
          isOpen={isRoomSettingsOpen}
          onOpenChange={setIsRoomSettingsOpen}
          room={usersPersonalRoom}
          onRoomCreated={handleRoomCreated}
          isCurrentRoomWritable={isCurrentRoomWritable}
          currentRoomId={currentRoomId}
          currentRoomName={currentRoomName}
        />
      )}
      {isMobile && isBugReportOpen && setIsBugReportOpen && (
        <BugReportModal isOpen={isBugReportOpen} onOpenChange={setIsBugReportOpen} />
      )}
    </DropdownMenu>
  );
}