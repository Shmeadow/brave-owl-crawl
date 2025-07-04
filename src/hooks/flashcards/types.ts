export interface CardData {
  id: string;
  user_id?: string; // Optional for local storage cards
  front: string;
  back: string;
  starred: boolean;
  status: 'new' | 'learning' | 'mastered';
  seen_count: number;
  last_reviewed_at: string | null;
  interval_days: number;
  correct_guesses: number;
  incorrect_guesses: number;
}