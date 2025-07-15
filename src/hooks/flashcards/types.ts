export interface CardData {
  id: string;
  user_id?: string;
  room_id: string | null;
  category_id?: string | null;
  front: string;
  back: string;
  starred: boolean;
  status: 'Learning' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Mastered';
  seen_count: number;
  last_reviewed_at: string | null;
  interval_days: number;
  correct_guesses: number;
  incorrect_guesses: number;
  created_at: string;
  ease_factor: number;
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}