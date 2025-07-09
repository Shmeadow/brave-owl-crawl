// src/lib/client-version.ts

import { toast } from "sonner";

// Increment this version number whenever there are breaking changes to local storage schemas
// or critical client-side updates that require a full local data reset.
const CLIENT_VERSION = "1.0.1"; // Initial version for this feature

const LOCAL_STORAGE_KEYS_TO_CLEAR = [
  'guest_flashcards',
  'guest_notes',
  'pomodoro_state', // This might be redundant if pomodoro_custom_times is used
  'pomodoro_custom_times',
  'app_background_url',
  'app_background_type',
  'app_background_mirrored',
  'app_active_effect',
  'active_sidebar_panel',
  'sidebar_always_open',
  'simple_audio_player_display_mode',
  'flashcard_session_history',
  'guest_calendar_events',
  'guest_tasks',
  'guest_goals',
  'current_room_id',
  'current_room_name',
  'app_background_blur',
  'active_widget_states',
];

export function checkAndClearClientData() {
  if (typeof window === 'undefined') {
    return; // Only run on the client side
  }

  const storedVersion = localStorage.getItem('client_version');

  if (storedVersion !== CLIENT_VERSION) {
    console.warn(`Client version mismatch detected! Stored: ${storedVersion}, Current: ${CLIENT_VERSION}. Clearing local storage...`);
    
    // Clear specific local storage keys
    LOCAL_STORAGE_KEYS_TO_CLEAR.forEach(key => {
      localStorage.removeItem(key);
    });

    // For keys with prefixes (like goal_notification_), iterate and remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('goal_notification_')) {
        localStorage.removeItem(key);
      }
    }

    localStorage.setItem('client_version', CLIENT_VERSION);
    toast.info("Application updated! Your local settings and guest data have been reset to ensure compatibility.");
  }
}