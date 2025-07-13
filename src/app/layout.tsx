import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { createClient } from '@supabase/supabase-js';
import { AppWrapper } from "@/app/app-wrapper";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { BackgroundProvider } from "@/context/background-provider";
import { BackgroundBlurProvider } from "@/context/background-blur-provider";
import { EffectProvider } from "@/context/effect-provider";
import { ClientOnlyWrapper } from '@/components/client-only-wrapper';
import { SpeedInsights } from "@vercel/speed-insights/next"; // Corrected import for Next.js App Router
import { getRandomBackground } from '@/lib/backgrounds'; // Import getRandomBackground

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CozyHub",
  description: "Your all-in-one productivity tool.",
};

// Define initial configurations for all widgets here to pass to WidgetProvider
const WIDGET_CONFIGS = {
  "spaces": { initialPosition: { x: 150, y: 100 }, initialWidth: 600, initialHeight: 600 },
  "sounds": { initialPosition: { x: 800, y: 150 }, initialWidth: 400, initialHeight: 500 },
  "calendar": { initialPosition: { x: 200, y: 200 }, initialWidth: 750, initialHeight: 650 },
  "timer": { initialPosition: { x: 900, y: 250 }, initialWidth: 350, initialHeight: 200 },
  "tasks": { initialPosition: { x: 250, y: 300 }, initialWidth: 450, initialHeight: 550 },
  "notes": { initialPosition: { x: 700, y: 100 }, initialWidth: 800, initialHeight: 700 }, // Increased size
  "media": { initialPosition: { x: 300, y: 400 }, initialWidth: 550, initialHeight: 450 },
  "stats-progress": { initialPosition: { x: 850, y: 100 }, initialWidth: 600, initialHeight: 650 }, // Renamed from games
  "flash-cards": { initialPosition: { x: 500, y: 100 }, initialWidth: 800, initialHeight: 650 },
  "goal-focus": { initialPosition: { x: 400, y: 550 }, initialWidth: 500, initialHeight: 550 },
  "background-effects": { initialPosition: { x: 900, y: 100 }, initialWidth: 400, initialHeight: 500 },
};

// Constants for layout dimensions (needed for mainContentArea calculation)
const HEADER_HEIGHT = 64; // px
const SIDEBAR_WIDTH = 60; // px
const CHAT_PANEL_WIDTH_OPEN = 320; // px
const CHAT_PANEL_WIDTH_CLOSED = 56; // px

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side Supabase client for fetching app settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let isCozyThemeGloballyEnabled = true; // Default to true

  // Generate a random background on the server
  const initialBackground = getRandomBackground();

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await supabaseServer
        .from('app_settings')
        .select('is_cozy_theme_enabled')
        .single();

      if (error) {
        console.error("Error fetching server-side app settings:", error.message || error); // Log error message
      } else if (data) {
        isCozyThemeGloballyEnabled = data.is_cozy_theme_enabled;
      }
    } catch (e) {
      console.error("Error initializing server-side Supabase client or fetching settings:", e);
    }
  } else {
    console.warn('Supabase environment variables not set for server-side fetching. NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SessionContextProvider>
          <BackgroundBlurProvider>
            <EffectProvider>
              <BackgroundProvider initialBackground={initialBackground}>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                  isCozyThemeGloballyEnabled={isCozyThemeGloballyEnabled}
                >
                  <SidebarProvider>
                    <ClientOnlyWrapper>
                      <AppWrapper initialWidgetConfigs={WIDGET_CONFIGS}>
                        {children}
                      </AppWrapper>
                    </ClientOnlyWrapper>
                  </SidebarProvider>
                </ThemeProvider>
              </BackgroundProvider>
            </EffectProvider>
          </BackgroundBlurProvider>
        </SessionContextProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}