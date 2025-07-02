import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner'; // Import toast for notifications

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    console.log('Attempting to initialize Supabase client with URL:', supabaseUrl, 'and Anon Key (first 5 chars):', supabaseAnonKey.substring(0, 5) + '...');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client initialized successfully.');
  } catch (e) {
    console.error('Error initializing Supabase client:', e);
    if (typeof window !== 'undefined') { // Only show toast in browser
      toast.error('Supabase client failed to initialize. Check console for details.');
    }
    supabase = null; // Ensure it's null if initialization fails
  }
} else {
  console.warn('Supabase client not initialized: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  if (typeof window !== 'undefined') { // Only show toast in browser
    toast.error('Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  }
}

export { supabase };