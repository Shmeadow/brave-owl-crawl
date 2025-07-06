"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    redirect('/dashboard');
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in or create an account to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]} // Removed 'google' and 'github' to enable email/password only
            theme="light"
            redirectTo="/dashboard"
          />
        </CardContent>
      </Card>
    </div>
  );
}