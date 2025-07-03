"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile-form";
import { Loader2 } from "lucide-react";

export default function AccountPage() {
  const { supabase, session, profile, loading, refreshProfile } = useSupabase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session && profile) {
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

  if (!supabase) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing Authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in or create an account to save your progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google', 'github']}
            theme="light"
            redirectTo="/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}