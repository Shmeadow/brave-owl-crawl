import { useSupabase } from '@/integrations/supabase/auth';

export type Background = { url: string; is_animated?: boolean };

export const staticImages: Background[] = [
  { url: '/images/backgrounds/forest.jpg' },
  // ... other static backgrounds ...
];

export const animatedBackgrounds: Background[] = [
  { url: 'https://...' , is_animated: true },
  // ...animated backgrounds...
];

export async function getRandomBackground(fallback: string): Promise<string> {
  const { supabase } = useSupabase();
  const { data, error } = await supabase
    .from('backgrounds')
    .select('url')
    .order('random()')
    .limit(1);

  if (error) {
    console.error("Background fetch failed: ", error.message);
    return fallback;
  }

  return data[0].url || fallback;
}