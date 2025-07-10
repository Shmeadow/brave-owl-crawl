"use client";

import React, { useState } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2, Chrome, Github } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Link from "next/link";
import { CustomSignupForm } from "@/components/auth/custom-signup-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
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

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      console.error(`Error signing in with ${provider}:`, error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4">
      <div
        className={cn(
          "w-full max-w-md p-8 rounded-xl shadow-lg",
          "bg-card border border-border",
          "flex flex-col items-center gap-6"
        )}
      >
        <h1 className="text-3xl font-extrabold text-foreground text-center">Welcome to CozyHub</h1>
        <p className="text-base text-muted-foreground text-center">
          {authFormType === 'sign_in' && 'Sign in to your account.'}
          {authFormType === 'sign_up' && 'Create a new account.'}
          {authFormType === 'forgotten_password' && 'Reset your password.'}
        </p>

        {authFormType === 'sign_in' && (
          <>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              redirectTo={window.location.origin + '/dashboard'}
              theme="dark"
              view="sign_in"
              showLinks={false}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email address',
                    password_label: 'Your Password',
                    email_input_placeholder: 'Your email address',
                    password_input_placeholder: 'Your Password',
                    button_label: 'Sign In',
                  },
                },
              }}
            />
            
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground text-center mb-2">Or connect with</p>
            <div className="flex gap-4 w-full justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleOAuthSignIn('google')}
                className="flex-1"
              >
                <Chrome className="mr-2 h-5 w-5" /> Google
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleOAuthSignIn('github')}
                className="flex-1"
              >
                <Github className="mr-2 h-5 w-5" /> GitHub
              </Button>
            </div>

            <div className="flex flex-col items-center gap-2 w-full mt-4">
              <Button variant="link" onClick={() => setAuthFormType('forgotten_password')} className="w-full">
                Forgot your password?
              </Button>
              <Button variant="link" onClick={() => setAuthFormType('sign_up')} className="w-full">
                Don't have an account? Sign Up
              </Button>
            </div>
          </>
        )}

        {authFormType === 'sign_up' && (
          <>
            <CustomSignupForm
              supabase={supabase}
              onSuccess={handleSignupSuccess}
              onSwitchToSignIn={() => setAuthFormType('sign_in')}
            />
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground text-center mb-2">Or connect with</p>
            <div className="flex gap-4 w-full justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleOAuthSignIn('google')}
                className="flex-1"
              >
                <Chrome className="mr-2 h-5 w-5" /> Google
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleOAuthSignIn('github')}
                className="flex-1"
              >
                <Github className="mr-2 h-5 w-5" /> GitHub
              </Button>
            </div>
            <Button variant="link" onClick={() => setAuthFormType('sign_in')} className="w-full mt-4">
              Already have an account? Sign In
            </Button>
          </>
        )}

        {authFormType === 'forgotten_password' && (
          <>
            <Auth
              supabaseClient={supabase}
              appearance={{ theme: ThemeSupa }}
              providers={[]}
              redirectTo={window.location.origin + '/dashboard'}
              theme="dark"
              view="forgotten_password"
              showLinks={false}
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