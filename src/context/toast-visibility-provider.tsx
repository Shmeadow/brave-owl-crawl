"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { toast as sonnerToast } from 'sonner'; // Import original sonner toast
import { useUserPreferences } from '@/hooks/use-user-preferences'; // Import the new user preferences hook

// Define the type for the custom toast object
interface CustomToast {
  success: typeof sonnerToast.success;
  error: typeof sonnerToast.error;
  info: typeof sonnerToast.info;
  warning: typeof sonnerToast.warning;
  // Add other toast methods if used (e.g., message, custom)
}

const ToastVisibilityContext = createContext<CustomToast | undefined>(undefined);

export function ToastVisibilityProvider({ children }: { children: React.ReactNode }) {
  const { preferences, loading } = useUserPreferences();

  const customToast: CustomToast = useMemo(() => {
    const shouldHideToasts = preferences?.hide_toasts ?? true; // Default to true (hide) if preferences not loaded

    const createWrappedToast = (originalToastMethod: Function) => {
      return (...args: any[]) => {
        if (shouldHideToasts) {
          // console.log("Toast hidden by user preference:", args[0]); // Optional: log hidden toasts
          return; // Do not show the toast
        }
        return originalToastMethod(...args);
      };
    };

    return {
      success: createWrappedToast(sonnerToast.success),
      error: createWrappedToast(sonnerToast.error),
      info: createWrappedToast(sonnerToast.info),
      warning: createWrappedToast(sonnerToast.warning),
    };
  }, [preferences?.hide_toasts]); // Recreate wrapped toast functions only when hide_toasts preference changes

  return (
    <ToastVisibilityContext.Provider value={customToast}>
      {children}
    </ToastVisibilityContext.Provider>
  );
}

export const toast = () => {
  const context = useContext(ToastVisibilityContext);
  if (context === undefined) {
    throw new Error('useCustomToast must be used within a ToastVisibilityProvider');
  }
  return context;
};