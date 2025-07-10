export interface RoomData {
  id: string;
  creator_id: string;
  name: string;
  created_at: string;
  is_member?: boolean; // Client-side flag to indicate if the current user is a member
  background_url: string | null;
  is_video_background: boolean | null;
  password_hash: string | null;
  type: 'public' | 'private'; // New: Room type
  closes_at: string | null; // New: Timestamp when the room closes
  deleted_at: string | null; // New: Soft delete timestamp
  description: string | null; // New: Room description
  profiles?: { first_name: string | null; last_name: string | null }[] | null; // Changed back to array
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  }[] | null;
}