"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

// Extend ThemeProviderProps to include our custom prop
interface CustomThemeProviderProps extends ThemeProviderProps {
  isCozyThemeGloballyEnabled: boolean;
}

export function ThemeProvider({ children, isCozyThemeGloballyEnabled, ...props }: CustomThemeProviderProps) {
  // Define available themes based on the global setting
  const availableThemes = isCozyThemeGloballyEnabled
    ? ["dark", "cozy"] // Only dark and cozy themes
    : ["dark"]; // Only dark theme if cozy is disabled

  return <NextThemesProvider {...props} themes={availableThemes} defaultTheme="dark">{children}</NextThemesProvider>;
}