"use client";

import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { EffectProvider } from "@/context/effect-provider";
import { BackgroundProvider } from "@/context/background-provider";
import { BackgroundBlurProvider } from "@/context/background-blur-provider";
import { useAppSettings } from "@/hooks/use-app-settings";
import { LoadingScreen } from "@/components/loading-screen";

export function Providers({ children }: { children: React.ReactNode }) {
  const { settings, loading } = useAppSettings();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      isCozyThemeGloballyEnabled={settings?.is_cozy_theme_enabled ?? false}
    >
      <BackgroundProvider>
        <BackgroundBlurProvider>
          <EffectProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </EffectProvider>
        </BackgroundBlurProvider>
      </BackgroundProvider>
    </ThemeProvider>
  );
}