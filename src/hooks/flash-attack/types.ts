export interface FlashMatch {
  id: string;
  room_id: string;
  creator_id: string;
  status: 'lobby' | 'in_progress' | 'completed' | 'cancelled';
  current_round_number: number;
  total_rounds: number;
  game_mode: 'free_for_all' | 'team_battle' | '1v1_duel';
  round_duration_seconds: number;
  deck_category_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { first_name: string | null; last_name: string | null; profile_image_url: string | null } | null;
  flashcard_categories?: { name: string } | null;
}

export interface FlashMatchPlayer {
  id: string;
  match_id: string;
  user_id: string;
  score: number;
  status: 'active' | 'disconnected' | 'kicked';
  joined_at: string;
  last_answer_time: string | null;
  profiles?: { first_name: string | null; last_name: string | null; profile_image_url: string | null } | null;
}

export interface FlashMatchRound {
  id: string;
  match_id: string;
  round_number: number;
  card_id: string | null;
  question: string;
  correct_answer: string;
  start_time: string;
  end_time: string | null;
  winner_player_id: string | null;
  round_end_time: string | null;
}

export interface FlashMatchPlayerAnswer {
  id: string;
  round_id: string;
  player_id: string;
  answer_text: string;
  is_correct: boolean;
  score_awarded: number;
  response_time: number; // in milliseconds
  created_at: string;
}