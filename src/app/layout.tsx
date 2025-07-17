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
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
// import { getRandomBackground } from '@/lib/backgrounds'; // Removed this import as we're using a fixed background

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
  "spaces": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "sounds": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "calendar": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "timer": { initialPosition: { x: 80, y: 70 }, initialWidth: 300, initialHeight: 350 },
  "tasks": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "drawing-board": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "journal": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "media": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "stats-progress": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "flash-cards": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "goal-focus": { initialPosition: { x: 80, y: 70 }, initialWidth: 650, initialHeight: 800 },
  "background-effects": { initialPosition: { x: 80, y: 70 }, initialWidth: 400, initialHeight: 600 },
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

  // Set a specific animated background as the initial default
  const initialBackground = { url: "/animated/ani2.mp4", isVideo: true, isMirrored: false };

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col`}
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
        <Analytics />
        {/* Google Analytics Script */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-W3N6THX1KY"></script>
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('config', 'G-W3N6THX1KY');
          // Define a global function to initialize GA
          window.initializeGoogleAnalytics = function() {
            gtag('config', 'G-W3N6THX1KY');
          };
          // Check local storage for existing consent on page load
          if (typeof window !== 'undefined') {
            const consent = localStorage.getItem('cookie_consent');
            if (consent === 'accepted') {
              window.initializeGoogleAnalytics();
            } else if (consent === 'declined') {
              // If declined, ensure gtag is a no-op
              window.gtag = function() {};
            }
          }
        `}} />
      </body>
    </html>
  );
}