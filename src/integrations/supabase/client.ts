import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner'; // Import toast for notifications

// Export a function to create the client, rather than the client itself
// This allows the client to be created within a component's lifecycle
// where process.env is guaranteed to be available.
export function createBrowserClient(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
    console.warn('Supabase client not initialized: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    if (typeof window !== 'undefined') {
      // toast.error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return null;
  }
}