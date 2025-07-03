export interface RoomData {
  id: string;
  creator_id: string;
  name: string;
  is_public: boolean;
  allow_guest_write: boolean;
  password_hash: string | null;
  created_at: string;
  is_member?: boolean; // Client-side flag to indicate if the current user is a member
}

export interface RoomInvite {
  id: string;
  room_id: string;
  code: string;
  creator_id: string;
  expires_at: string | null;
  created_at: string;
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