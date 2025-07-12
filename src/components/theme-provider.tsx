"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

// Extend ThemeProviderProps to include our custom prop
interface CustomThemeProviderProps extends ThemeProviderProps {
  isCozyThemeGloballyEnabled: boolean; // Keep this prop for now, but its usage will change
}

export function ThemeProvider({ children, isCozyThemeGloballyEnabled, ...props }: CustomThemeProviderProps) {
  // DaisyUI themes are automatically added by the plugin.
  // We'll use a subset of common themes for now.
  // The 'cozy' theme is removed as it's a custom theme not directly supported by DaisyUI.
  const availableThemes = ["light", "dark", "cupcake", "dracula", "system"];

  return <NextThemesProvider {...props} themes={availableThemes}>{children}</NextThemesProvider>;
}