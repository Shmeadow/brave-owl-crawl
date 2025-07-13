"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/integrations/supabase/auth';
import { LoadingScreen } from '@/components/loading-screen';

export default function HomePage() {
  const { session, loading } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    // We only want to redirect once the session loading is complete
    if (!loading) {
      if (session) {
        // If there's a session, go to the dashboard
        router.replace('/dashboard');
      } else {
        // If there's no session, go to the landing page
        router.replace('/landing');
      }
    }
  }, [session, loading, router]);

  // Show a loading screen while the session is being determined
  return <LoadingScreen />;
}