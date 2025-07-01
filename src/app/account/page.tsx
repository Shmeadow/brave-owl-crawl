"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase, UserProfile } from '@/integrations/supabase/auth'; // Import UserProfile
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function AccountPage() {
  const { supabase, session, profile, loading, refreshProfile } = useSupabase();
  const router = useRouter();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading account details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (session && profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-background py-8">
          <Card className="w-full max-w-md p-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
              <p className="text-muted-foreground">Manage your account information.</p>
            </CardHeader>
            <CardContent>
              <ProfileForm initialProfile={profile} onProfileUpdated={refreshProfile} />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Only render Auth component if supabase client is available and not logged in
  if (!supabase) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full bg-background">
          <Card className="w-full max-w-md p-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
              <p className="text-muted-foreground">Supabase client is not initialized. Please check environment variables.</p>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full bg-background py-8">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Account</CardTitle>
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
    </DashboardLayout>
  );
}