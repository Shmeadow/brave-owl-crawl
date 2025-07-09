"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Loader2 } from "lucide-react";
import { redirect } from "next/navigation"; // Removed useRouter

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  // Removed useRouter and loginFormRef as handleDismiss is removed

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    redirect('/dashboard');
  }

  if (!supabase) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Initializing Authentication...</p>
        </div>
      </div>
    );
  }

  // Removed handleDismiss function

  return (
    <div className="w-full h-screen flex items-center justify-center py-12"> {/* Simplified layout */}
      <div
        className="mx-auto grid w-full max-w-sm gap-6 p-4 rounded-lg shadow-lg bg-card/50 backdrop-blur-xl border-white/20"
        // Removed onClick handler
      >
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">Sign In / Sign Up</h1> {/* Changed title to be more generic */}
          <p className="text-balance text-muted-foreground">
            Access your personalized workspace.
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google", "github"]}
          theme="light"
          view="sign_in" // Default to sign_in view
          redirectTo="/dashboard"
          localization={{
            variables: {
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a password',
                button_label: 'Create account',
                social_provider_text: 'Sign up with {{provider}}',
                link_text: "Already have an account? Sign in",
              },
              sign_in: {
                email_label: 'Email address',
                password_label: 'Your password',
                button_label: 'Sign in',
                social_provider_text: 'Sign in with {{provider}}',
                link_text: "Don't have an account? Create one",
              },
            },
          }}
        />
      </div>
    </div>
  );
}