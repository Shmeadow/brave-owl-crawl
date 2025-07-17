"use client";

import React, { useState } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2, Chrome, Github } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared'; // Corrected import path
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

  // Define common appearance settings for Auth component
  const commonAuthAppearance = {
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          inputBackground: 'hsl(var(--input))',
          inputBorder: 'hsl(var(--border))',
          inputFocusBorder: 'hsl(var(--primary))',
          inputLabelText: 'hsl(var(--foreground))',
          inputText: 'hsl(var(--foreground))',
          // Adjust button colors to match our theme if needed, or rely on default ThemeSupa
          // buttonBackground: 'hsl(var(--primary))',
          // buttonText: 'hsl(var(--primary-foreground))',
          // buttonBorder: 'hsl(var(--primary))',
          // buttonHoverBackground: 'hsl(var(--primary-foreground))',
          // buttonHoverText: 'hsl(var(--primary))',
        },
      },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-transparent p-2 sm:p-4"> {/* Reduced padding for mobile */}
      <div
        className={cn(
          "w-full max-w-md p-4 sm:p-6 rounded-xl shadow-lg", // Reduced padding for mobile
          "bg-card border border-border",
          "flex flex-col items-center gap-3 sm:gap-4" // Reduced gap for mobile
        )}
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground text-center">Welcome to CozyHub</h1> {/* Reduced font size for mobile */}
        <p className="text-sm sm:text-base text-muted-foreground text-center"> {/* Reduced font size for mobile */}
          {authFormType === 'sign_in' && 'Sign in to your account.'}
          {authFormType === 'sign_up' && 'Create a new account.'}
          {authFormType === 'forgotten_password' && 'Reset your password.'}
        </p>

        {authFormType === 'sign_in' && (
          <>
            <Auth
              supabaseClient={supabase}
              appearance={commonAuthAppearance} // Apply common appearance
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
            
            <Separator className="my-2 sm:my-3" /> {/* Reduced margin for mobile */}
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-0.5 sm:mb-1">Or connect with</p> {/* Reduced font size and margin for mobile */}
            <div className="flex gap-2 sm:gap-3 w-full justify-center"> {/* Reduced gap for mobile */}
              <Button
                variant="outline"
                size="sm" // Reduced size for mobile
                onClick={() => handleOAuthSignIn('google')}
                className="flex-1 text-xs sm:text-sm" // Reduced font size for mobile
              >
                <Chrome className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" /> Google {/* Reduced icon size for mobile */}
              </Button>
              <Button
                variant="outline"
                size="sm" // Reduced size for mobile
                onClick={() => handleOAuthSignIn('github')}
                className="flex-1 text-xs sm:text-sm" // Reduced font size for mobile
              >
                <Github className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" /> GitHub {/* Reduced icon size for mobile */}
              </Button>
            </div>

            <div className="flex flex-col items-center gap-0.5 sm:gap-1 w-full mt-2 sm:mt-3"> {/* Reduced gap and margin for mobile */}
              <Button variant="link" onClick={() => setAuthFormType('forgotten_password')} className="w-full text-xs sm:text-sm"> {/* Reduced font size for mobile */}
                Forgot your password?
              </Button>
              <Button variant="link" onClick={() => setAuthFormType('sign_up')} className="w-full text-xs sm:text-sm"> {/* Reduced font size for mobile */}
                Don't have an account? Sign Up
              </Button>
            </div>
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
              appearance={commonAuthAppearance} // Apply common appearance
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
            <Button variant="link" onClick={() => setAuthFormType('sign_in')} className="w-full mt-1.5 sm:mt-2 text-xs sm:text-sm"> {/* Reduced margin and font size for mobile */}
              Back to Sign In
            </Button>
          </>
        )}
        
        <Link href="/landing" className="text-xs sm:text-sm text-muted-foreground hover:underline mt-2 sm:mt-3"> {/* Reduced font size and margin for mobile */}
          Back to Landing Page
        </Link>
      </div>
    </div>
  );
}