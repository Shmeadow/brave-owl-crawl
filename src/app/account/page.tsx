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
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    redirect('/login');
  }

  if (profile) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full py-8">
        <h1 className="text-3xl font-bold text-foreground text-center">Account Settings</h1>
        <Card className="w-full bg-card backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-foreground">My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm initialProfile={profile} onProfileUpdated={refreshProfile} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback while profile is loading after session is confirmed
  return (
    <div className="flex items-center justify-center h-full py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}