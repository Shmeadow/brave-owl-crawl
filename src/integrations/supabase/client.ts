// REMOVE both of these imports:
-import * as dotenv from 'dotenv';
-dotenv.config();

// ADD instead:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLIC_KEY = import.meta.env.VITA_SUPABASE_PUBLIC_KEY;

export const createClient = (): SupabaseClient => {
  return createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
};