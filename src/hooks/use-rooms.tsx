"use client";

import { useRoomFetching } from "./rooms/use-room-fetching";
import { useRoomManagement } from "./rooms/use-room-management";
import { useRoomMembership } from "./rooms/use-room-membership";
import { useRoomJoinRequests } from "./rooms/use-room-join-requests"; // New import
import { RoomData, RoomMember } from "./rooms/types"; // Re-export types
import { useSupabase } from "@/integrations/supabase/auth"; // Import useSupabase

export type { RoomData, RoomMember }; // Re-export for external use

export function useRooms() {
  const { rooms, loading, fetchRooms, setRooms } = useRoomFetching(); // Get setRooms from useRoomFetching
  const { refreshProfile } = useSupabase(); // Get refreshProfile from useSupabase
  const {
    handleCreateRoom,
    handleSendRoomInvitation, // Renamed and updated
    handleDeleteRoom,
    handleUpdateRoomType, // Exposed
    handleSetRoomPassword, // Exposed
    handleUpdateRoomDescription, // Exposed
    handleUpdateRoomBackground, // Exposed
  } = useRoomManagement({ setRooms, fetchRooms, refreshProfile }); // Pass setRooms and refreshProfile to useRoomManagement
  const {
    handleJoinRoomByRoomId,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
  } = useRoomMembership({ rooms, fetchRooms });
  const {
    pendingRequests, // New: Expose pending requests
    acceptRequest,   // New: Expose accept function
    declineRequest,  // New: Expose decline function
    dismissRequest,  // New: Expose dismiss function
  } = useRoomJoinRequests({ rooms }); // Pass rooms to the new hook

  return {
    rooms,
    loading,
    handleCreateRoom,
    handleSendRoomInvitation, // New function
    handleDeleteRoom,
    handleUpdateRoomType, // Exposed
    handleSetRoomPassword, // Exposed
    handleUpdateRoomDescription, // Exposed
    handleUpdateRoomBackground, // Exposed
    handleJoinRoomByRoomId,
    handleJoinRoomByPassword,
    handleLeaveRoom,
    handleKickUser,
    fetchRooms, // Expose fetchRooms for manual refresh if needed
    pendingRequests, // New: Expose pending requests
    acceptRequest,   // New: Expose accept function
    declineRequest,  // New: Expose decline function
    dismissRequest,  // New: Expose dismiss function
  };
}