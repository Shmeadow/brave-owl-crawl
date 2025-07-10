"use client";

import React, { useState } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Link from "next/link";
import { CustomSignupForm } from "@/components/auth/custom-signup-form";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
  // State to control which authentication form is displayed
  const [authFormType, setAuthFormType] = useState<'sign_in' | 'sign_up' | 'forgotten_password'>('sign_in');

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

  const handleSignupSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4"> {/* Changed to bg-transparent for full background visibility */}
      <div
        className={cn(
          "w-full max-w-sm p-10 rounded-xl shadow-2xl",
          "bg-transparent backdrop-blur-xl border-white/40", // Main login card with transparency and blur
          "flex flex-col items-center gap-8"
        )}
      >
        <h1 className="text-4xl font-extrabold text-foreground text-center">Welcome to CozyHub</h1>
        <p className="text-lg text-muted-foreground text-center mb-4">
          {authFormType === 'sign_in' && 'Sign in to your account.'}
          {authFormType === 'sign_up' && 'Create a new account.'}
          {authFormType === 'forgotten_password' && 'Reset your password.'}
        </p>

        {authFormType === 'sign_in' && (
          <>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'github']}
              redirectTo={window.location.origin + '/dashboard'}
              theme="dark"
              view="sign_in" // Explicitly set view to sign_in
              showLinks={false} // Hide default navigation links to control them manually
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email address',
                    password_label: 'Your Password',
                    email_input_placeholder: 'Your email address',
                    password_input_placeholder: 'Your Password',
                    button_label: 'Sign In',
                    social_provider_text: 'Or connect with', // Text for social providers
                  },
                  sign_up: {
                    social_provider_text: 'Or connect with', // Text for social providers in signup view
                  },
                  forgotten_password: {
                    email_label: 'Email address',
                    email_input_placeholder: 'Your email address',
                    button_label: 'Send reset instructions',
                  },
                },
              }}
            />
            <Button variant="link" onClick={() => setAuthFormType('forgotten_password')} className="w-full mt-2">
              Forgot your password?
            </Button>
            <Button variant="link" onClick={() => setAuthFormType('sign_up')} className="w-full">
              Don't have an account? Sign Up
            </Button>
          </>
        )}

        {authFormType === 'sign_up' && (
          <CustomSignupForm
            supabase={supabase}
            onSuccess={handleSignupSuccess}
            onSwitchToSignIn={() => setAuthFormType('sign_in')}
          />
        )}

        {authFormType === 'forgotten_password' && (
          <>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]} // No social providers for password reset
              redirectTo={window.location.origin + '/dashboard'}
              theme="dark"
              view="forgotten_password" // Explicitly set view to forgotten_password
              showLinks={false} // Hide default navigation links
              localization={{
                variables: {
                  forgotten_password: {
                    email_label: 'Email address',
                    email_input_placeholder: 'Your email address',
                    button_label: 'Send reset instructions',
                  },
                },
              }}
            />
            <Button variant="link" onClick={() => setAuthFormType('sign_in')} className="w-full mt-2">
              Back to Sign In
            </Button>
          </>
        )}
        
        <Link href="/landing" className="text-sm text-muted-foreground hover:underline mt-4">
          Back to Landing Page
        </Link>
      </div>
    </div>
  );
}