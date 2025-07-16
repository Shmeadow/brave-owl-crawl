"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

// Extend ThemeProviderProps to include our custom prop
interface CustomThemeProviderProps extends ThemeProviderProps {
  // isCozyThemeGloballyEnabled: boolean; // Removed as themes are simplified
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  // Define available themes based on the global setting
  const availableThemes = ["dark"]; // Only 'dark' theme is available

  return <NextThemesProvider {...props} themes={availableThemes}>{children}</NextThemesProvider>;
}