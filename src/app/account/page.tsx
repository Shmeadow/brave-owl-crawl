"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSupabase } from '@/integrations/supabase/auth';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/dashboard-layout';
import { toast } from 'sonner';
import { ProfileForm } from '@/components/profile-form'; // Import the new ProfileForm

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  role: string | null;
}

export default function AccountPage() {
  const { supabase, session, loading: authLoading } = useSupabase();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!supabase || !session) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, profile_image_url, role')
      .eq('id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (new user)
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data.");
      setProfile(null);
    } else if (data) {
      setProfile(data as UserProfile);
    } else {
      // If no profile found, create a default one
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: session.user.id, first_name: null, last_name: null, profile_image_url: null, role: 'user' })
        .select('id, first_name, last_name, profile_image_url, role')
        .single();

      if (insertError) {
        console.error("Error creating default profile:", insertError);
        toast.error("Failed to create default profile.");
      } else if (newProfile) {
        setProfile(newProfile as UserProfile);
      }
    }
    setProfileLoading(false);
  }, [supabase, session]);

  useEffect(() => {
    if (!authLoading) {
      if (session) {
        fetchProfile();
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    }
  }, [session, authLoading, fetchProfile]);

  if (authLoading || profileLoading) {
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
              <ProfileForm initialProfile={profile} onProfileUpdated={fetchProfile} />
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