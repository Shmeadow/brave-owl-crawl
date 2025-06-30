"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '@/integrations/supabase/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';
import { toast } from 'sonner';

export default function AccountPage() {
  const { supabase, session, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (!loading && session) {
      // If user logs in successfully, redirect to dashboard
      toast.success("Logged in successfully!");
      router.push('/');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>Loading account details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Card className="w-full max-w-md p-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">Account</CardTitle>
              <p className="text-muted-foreground">You are currently logged in.</p>
            </CardHeader>
            <CardContent>
              <p className="text-center text-lg font-medium">Welcome, {session.user.email}!</p>
              {/* You can add more profile details here later */}
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
        <div className="flex items-center justify-center min-h-screen bg-background">
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
      <div className="flex items-center justify-center min-h-screen bg-background">
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
              redirectTo="/account" // Redirect back to account page after auth event
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}