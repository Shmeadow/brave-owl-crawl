export function useSupabase() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadSession() {
      const session = await supabase.auth.session();
      setSession(session);
    
      if (session) {
        const user = await getProfile(session.user.id);
        setProfile(user);
      }
    }
    loadSession();
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.log("Sign out error:", error.message);
  }

  return { session, profile, loading, signOut };
}

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}