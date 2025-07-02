"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase, UserProfile } from '@/integrations/supabase/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from '@/components/profile-form';

export default function AccountPage() {
  const { supabase, session, profile, loading, refreshProfile } = useSupabase();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground">Loading account details...</p>
      </div>
    );
  }

  if (session && profile) {
    return (
      <div className="flex items-center justify-center h-full bg-background py-8">
        <Card className="w-full max-w-md p-6 bg-card backdrop-blur-xl border-white/20"> {/* Removed /40 */}
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Your Profile</CardTitle>
            <p className="text-muted-foreground">Manage your account information.</p>
          </CardHeader>
          <CardContent>
            <ProfileForm initialProfile={profile} onProfileUpdated={refreshProfile} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only render Auth component if supabase client is available and not logged in
  if (!supabase) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Card className="w-full max-w-md p-6 bg-card backdrop-blur-xl border-white/20"> {/* Removed /40 */}
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">Authentication Error</CardTitle>
            <p className="text-muted-foreground">Supabase client is not initialized. Please check environment variables.</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full bg-background py-8">
      <Card className="w-full max-w-md p-6 bg-card backdrop-blur-xl border-white/20"> {/* Removed /40 */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground">Account</CardTitle>
          <p className="text-muted-foreground">Sign up or log in to save your progress</p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={['google', 'linkedin', 'facebook']}
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
            theme="light"
            redirectTo="/"
          />
        </CardContent>
      </Card>
    </div>
  );
}