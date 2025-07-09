"use client";

import React, { useState, useEffect } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Loader2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { LoginFeatureSection } from "@/components/login-feature-section";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true); // Dialog is open by default

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleDialogStateChange = (newOpenState: boolean) => {
    setIsOpen(newOpenState);
    if (!newOpenState) { // If the dialog is closing
      router.push('/dashboard'); // Redirect to dashboard
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
    <Dialog open={isOpen} onOpenChange={handleDialogStateChange}>
      <DialogContent className="fixed inset-0 w-screen h-screen max-w-none p-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <div className="w-full lg:grid lg:grid-cols-2 xl:h-screen max-h-full overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className={cn(
              "mx-auto grid w-full max-w-sm gap-6 p-4 rounded-lg shadow-lg",
              "bg-card/50 backdrop-blur-xl border-white/20"
            )}>
              <div className="grid gap-2 text-center">
                <h1 className="text-3xl font-bold">Create an Account</h1>
                <p className="text-balance text-muted-foreground">
                  Enter your details below to create your CozyHub account.
                </p>
              </div>
              <Auth
                supabaseClient={supabase}
                appearance={{ theme: ThemeSupa }}
                providers={["google", "github"]}
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
          <LoginFeatureSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}