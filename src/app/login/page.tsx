"use client";

import React, { useRef } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { Loader2 } from "lucide-react";
import { redirect, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthForm } from "@/components/auth/auth-form.tsx"; // Confirmed path and extension

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
      className="flex items-center justify-center min-h-screen"
      onClick={handleDismiss}
    >
      <div
        ref={loginFormRef}
        className={cn(
          "mx-auto grid w-full max-w-sm gap-6 p-4 rounded-lg shadow-lg",
          "bg-card/50 backdrop-blur-xl border-white/20"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <AuthForm onAuthSuccess={() => router.push('/dashboard')} />
      </div>
    </div>
  );
}