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
import { Button } from "@/components/ui/button"; // Import Button component

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div
        className={cn(
          "w-full max-w-sm p-10 rounded-xl shadow-2xl",
          "bg-card/30 backdrop-blur-xl border-white/40",
          "flex flex-col items-center gap-8"
        )}
      >
        <h1 className="text-4xl font-extrabold text-foreground text-center">Welcome to CozyHub</h1>
        <p className="text-lg text-muted-foreground text-center mb-4">
          {view === 'sign_in' ? 'Sign in to your account.' : 'Create a new account.'}
        </p>

        {view === 'sign_in' ? (
          <>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={['google', 'github']}
              redirectTo={window.location.origin + '/dashboard'}
              theme="dark"
              view="sign_in"
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email address',
                    password_label: 'Your Password',
                    email_input_placeholder: 'Your email address',
                    password_input_placeholder: 'Your Password',
                    button_label: 'Sign In',
                    social_provider_text: '',
                    link_text: 'Already have an account? Sign in',
                  },
                  sign_up: {
                    social_provider_text: '',
                  },
                },
              }}
            />
            <Button variant="link" onClick={() => setView('sign_up')} className="w-full mt-2">
              Don't have an account? Sign Up
            </Button>
          </>
        ) : (
          <CustomSignupForm
            supabase={supabase}
            onSuccess={handleSignupSuccess}
            onSwitchToSignIn={() => setView('sign_in')}
          />
        )}
        
        <Link href="/landing" className="text-sm text-muted-foreground hover:underline mt-4">
          Back to Landing Page
        </Link>
      </div>
    </div>
  );
}