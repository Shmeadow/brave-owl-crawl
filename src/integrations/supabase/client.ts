import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner'; // Import toast for notifications

// Export a function to create the client, rather than the client itself
// This allows the client to be created within a component's lifecycle
// where process.env is guaranteed to be available.
export function createBrowserClient(): SupabaseClient | null {
  const supabaseUrl = "https://mrdupsekghsnbooyrdmj.supabase.co";
  const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZHVwc2VrZ2hzbmJvb3lyZG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDM0ODYsImV4cCI6MjA2Njg3OTQ4Nn0.enmXsshBH69-oLcOdrMbUxpwtHq5f5wjYA6k-08BU-8";

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      return client;
    } catch (e) {
      console.error('Error initializing Supabase client:', e);
      if (typeof window !== 'undefined') {
        toast.error('Supabase client failed to initialize. Check console for details.');
      }
      return null;
    }
  } else {
    console.warn('Supabase client not initialized: Credentials are not defined.');
    if (typeof window !== 'undefined') {
      toast.error('Supabase credentials are not defined.');
    }
    return null;
  }
}