"use client";

import React, { useRef } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Loader2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
// Removed: import { LoginFeatureSection } from "@/components/login-feature-section";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
  const loginFormRef = useRef<HTMLDivElement>(null);

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

  const handleDismiss = (event: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click occurred outside the login form itself
    if (loginFormRef.current && !loginFormRef.current.contains(event.target as Node)) {
      router.push('/landing');
    }
  };

  return (
    <div
      className="w-full lg:grid lg:h-screen lg:grid-cols-2 xl:h-screen"
      onClick={handleDismiss}
    >
      <div className="flex items-center justify-center py-12">
        <div
          ref={loginFormRef}
          className={cn(
            "mx-auto grid w-full max-w-sm gap-6 p-4 rounded-lg shadow-lg",
            "bg-card/50 backdrop-blur-xl border-white/20"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Sign In / Sign Up</h1>
            <p className="text-balance text-muted-foreground">
              Access your personalized workspace.
            </p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google", "github"]}
            theme="light"
            view="sign_in"
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
      {/* Removed: <LoginFeatureSection /> */}
    </div>
  );
}