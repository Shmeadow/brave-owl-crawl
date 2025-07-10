"use client";

import React, { useRef } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Auth } from '@supabase/auth-ui-react'; // Import Auth component
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Import ThemeSupa for styling
import Link from "next/link"; // Import Link for navigation

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
  // Removed loginFormRef as handleDismiss is no longer needed.

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div
        className={cn(
          "w-full max-w-sm p-8 rounded-lg shadow-lg",
          "bg-card/50 backdrop-blur-xl border-white/20",
          "flex flex-col items-center gap-6"
        )}
      >
        <h1 className="text-3xl font-bold text-foreground text-center">Welcome to CozyHub</h1>
        <p className="text-muted-foreground text-center mb-4">Sign in or create an account to get started.</p>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          redirectTo={window.location.origin + '/dashboard'}
          theme="dark"
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email address',
                password_label: 'Your Password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Your Password',
                button_label: 'Sign In',
                social_provider_text: 'Or continue with',
                link_text: 'Already have an account? Sign in',
              },
              sign_up: {
                email_label: 'Email address',
                password_label: 'Create a Password',
                email_input_placeholder: 'Your email address',
                password_input_placeholder: 'Create a Password',
                button_label: 'Sign Up',
                social_provider_text: 'Or sign up with',
                link_text: 'Don\'t have an account? Sign up',
              },
              magic_link: {
                email_input_placeholder: 'Your email address',
                button_label: 'Send Magic Link',
                link_text: 'Send a magic link',
              },
              forgotten_password: {
                email_input_placeholder: 'Your email address',
                button_label: 'Send Reset Instructions',
                link_text: 'Forgot your password?',
              },
              update_password: {
                password_label: 'New Password',
                password_input_placeholder: 'Your New Password',
                button_label: 'Update Password',
              },
            },
          }}
        />
        <Link href="/landing" className="text-sm text-muted-foreground hover:underline mt-4">
          Back to Landing Page
        </Link>
      </div>
    </div>
  );
}