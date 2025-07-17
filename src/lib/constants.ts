export const MOBILE_CONTROLS_HEIGHT = 40; // px - Estimated height of the mobile controls bar (this might be removed or re-evaluated)
export const MOBILE_HORIZONTAL_SIDEBAR_HEIGHT = 48; // px - Height of the new horizontal sidebar on mobile
export const HEADER_HEIGHT_MOBILE = 48; // px - New constant for mobile header height
export const MOBILE_HEADER_EFFECTIVE_HEIGHT = 64; // px - HEADER_HEIGHT_MOBILE (48px) + py-2 (8px top + 8px bottom) = 64px

// New constants for the new mobile layout
export const MOBILE_MEDIA_PLAYER_TOP_OFFSET = MOBILE_HEADER_EFFECTIVE_HEIGHT + 8; // 8px gap below header
export const MOBILE_MEDIA_PLAYER_RIGHT_OFFSET = 4; // 4px from right edge

export const MOBILE_CONTROLS_BOTTOM_OFFSET = 4; // 4px from bottom edge of screen
export const MOBILE_CONTROLS_HORIZONTAL_PADDING = 4; // 4px left/right padding for the controls container

export const MOBILE_POMODORO_HEIGHT_EXPANDED = 200; // Approximate height of expanded Pomodoro widget
export const MOBILE_POMODORO_HEIGHT_MINIMIZED = 96; // Approximate height of minimized Pomodoro widget (w-24 h-24)
export const MOBILE_CONTROLS_GAP_VERTICAL = 8; // Gap between Pomodoro and Sidebar within MobileControls