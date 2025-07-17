"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";

export default function AccountPage() {
  const { session, profile, loading, refreshProfile } = useSupabase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-4 sm:py-8"> {/* Reduced vertical padding for mobile */}
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" /> {/* Reduced icon size for mobile */}
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  if (profile) {
    return (
      <div className="flex flex-col items-center gap-4 sm:gap-8 w-full max-w-xl mx-auto h-full py-4 sm:py-8 px-2 sm:px-0"> {/* Reduced gap and padding for mobile, max-width slightly smaller */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground text-center">Account Settings</h1> {/* Reduced font size for mobile */}
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader className="p-3 sm:p-4"> {/* Reduced padding for mobile */}
            <CardTitle className="text-lg sm:text-xl text-foreground">My Profile</CardTitle> {/* Reduced font size for mobile */}
          </CardHeader>
          <CardContent className="p-3 sm:p-4"> {/* Reduced padding for mobile */}
            <ProfileForm initialProfile={profile} onProfileUpdated={refreshProfile} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback while profile is loading after session is confirmed
  return (
    <div className="flex items-center justify-center h-full py-4 sm:py-8"> {/* Reduced vertical padding for mobile */}
      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" /> {/* Reduced icon size for mobile */}
    </div>
  );
}