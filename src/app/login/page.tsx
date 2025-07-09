"use client";

import React from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Loader2, Feather } from "lucide-react";
import { redirect } from "next/navigation";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();

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
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-balance text-muted-foreground">
              Enter your details below to create your CozyHub account.
            </p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            theme="light"
            view="sign_up"
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
      <div className="hidden bg-muted lg:flex items-center justify-center p-10">
        <div className="text-center">
          <Feather className="mx-auto h-16 w-16 text-primary mb-4" />
          <h2 className="text-4xl font-bold">Welcome to CozyHub</h2>
          <p className="text-xl text-muted-foreground mt-2">
            Your all-in-one productivity and focus sanctuary.
          </p>
          <p className="mt-8 max-w-md mx-auto">
            Sign up to unlock your personalized dashboard, track your goals, manage tasks, and create your perfect digital environment for deep work and relaxation.
          </p>
        </div>
      </div>
    </div>
  );
}