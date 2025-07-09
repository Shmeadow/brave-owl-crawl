import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js';

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session } } = await supabaseServer.auth.getSession();

      if (session) {
        redirect('/dashboard');
      }
    } catch (e) {
      console.error("Error checking session on root page:", e);
      // Fall through to landing if session check fails
    }
  }
  
  redirect('/landing');
}