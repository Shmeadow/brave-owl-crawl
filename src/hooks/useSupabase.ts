import { createClient, SupabaseClient } from '@supabase/supabase-js';

const createSupabaseClient = (): SupabaseClient => {
  return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLIC_KEY, {
    auth: {
      persistSession: true,    // Enabled
      detectSessionInUrl: true,
      autoRefreshToken: true,
      persistAccessTokenInUrl: true,
    },    
  });
};

export const useSupabase = () => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const client = createSupabaseClient();

  useEffect(() => {
    const { data: authListener } = client.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setProfile(profile);
      }
      setLoading(false); // Moved here to avoid race conditions
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [client]);

  return { supabase:client, session, profile, loading };
};

export async function fetchProfile(userId) {
  const { data, error } = await client
    .from('profiles')
    .select()
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error("Profile fetch error:", error.message);
    return null;
  }
  return data;
}