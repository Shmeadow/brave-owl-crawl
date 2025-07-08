import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function createBrowserClient(addNotification: (options: any) => void): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      return client;
    } catch (e: any) {
      console.error('Error initializing Supabase client:', e);
      if (typeof window !== 'undefined') {
        addNotification({ title: 'Initialization Error', message: 'Supabase client failed to initialize. Check console for details.', type: 'error' });
      }
      return null;
    }
  } else {
    console.warn('Supabase client not initialized: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    if (typeof window !== 'undefined') {
      addNotification({ title: 'Configuration Error', message: 'Supabase environment variables are missing.', type: 'error' });
    }
    return null;
  }
}