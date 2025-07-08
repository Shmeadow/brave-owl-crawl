import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotificationOptions } from '@/context/notification-provider';

export function createBrowserClient(addNotification: (options: NotificationOptions) => void): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (e: any) {
      console.error('Error initializing Supabase client:', e);
      if (typeof window !== 'undefined') {
        addNotification({ title: 'Initialization Error', message: 'Supabase client failed to initialize.', type: 'error' });
      }
      return null;
    }
  } else {
    if (typeof window !== 'undefined') {
      addNotification({ title: 'Configuration Error', message: 'Supabase environment variables are missing.', type: 'error' });
    }
    return null;
  }
}