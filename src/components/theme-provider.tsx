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
    ? ["light", "dark", "system", "cozy"]
    : ["light", "dark", "system"];

  return <NextThemesProvider {...props} themes={availableThemes}>{children}</NextThemesProvider>;
}