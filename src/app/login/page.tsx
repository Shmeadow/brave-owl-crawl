"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '@/integrations/supabase/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) { // Only redirect if not loading and session exists
      router.push('/'); // Redirect to dashboard if already logged in
    }
  }, [session, loading, router]);

  if (loading || session) { // Don't render login form if loading or already logged in
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Checking authentication status...</p>
      </div>
    );
  }

  // Only render Auth component if supabase client is available
  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
            <p className="text-muted-foreground">Supabase client is not initialized. Please check environment variables.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back!</CardTitle>
          <p className="text-muted-foreground">Sign in to access your Productivity Hub</p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={['google', 'linkedin', 'facebook']} // Added social providers
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light" // Default to light theme, can be adjusted by user's theme preference
            redirectTo={process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/'}
          />
        </CardContent>
      </Card>
    </div>
  );
}