import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { createClient } from '@supabase/supabase-js';
import { AppWrapper } from "@/app/app-wrapper";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { SidebarProvider } from "@/components/sidebar/sidebar-context";
import { BackgroundProvider } from "@/context/background-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Productivity Hub",
  description: "Your all-in-one productivity tool.",
};

// Define initial configurations for all widgets here to pass to WidgetProvider
const WIDGET_CONFIGS = {
  "spaces": { initialPosition: { x: 150, y: 100 }, initialWidth: 600, initialHeight: 700 },
  "sounds": { initialPosition: { x: 800, y: 150 }, initialWidth: 500, initialHeight: 600 },
  "calendar": { initialPosition: { x: 200, y: 200 }, initialWidth: 800, initialHeight: 700 },
  "timer": { initialPosition: { x: 900, y: 250 }, initialWidth: 400, initialHeight: 400 },
  "tasks": { initialPosition: { x: 250, y: 300 }, initialWidth: 500, initialHeight: 600 },
  "notes": { initialPosition: { x: 700, y: 350 }, initialWidth: 500, initialHeight: 600 },
  "media": { initialPosition: { x: 300, y: 400 }, initialWidth: 600, initialHeight: 500 },
  "fortune": { initialPosition: { x: 850, y: 450 }, initialWidth: 400, initialHeight: 300 },
  "background-images": { initialPosition: { x: 350, y: 500 }, initialWidth: 500, initialHeight: 400 },
  "flash-cards": { initialPosition: { x: 500, y: 100 }, initialWidth: 900, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 400, y: 550 }, initialWidth: 500, initialHeight: 600 },
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

  // Log the environment variables to help diagnose
  console.log('Server-side Supabase URL:', supabaseUrl ? 'Loaded' : 'Undefined');
  console.log('Server-side Supabase Anon Key:', supabaseAnonKey ? 'Loaded' : 'Undefined');
  console.log('Attempting to initialize server-side Supabase client with URL:', supabaseUrl, 'and Anon Key (first 5 chars):', supabaseAnonKey?.substring(0, 5) + '...'); // Corrected substring

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

  // Note: mainContentArea cannot be calculated here on the server side as it depends on window dimensions.
  // It will be calculated client-side in AppWrapper.

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <BackgroundProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            isCozyThemeGloballyEnabled={isCozyThemeGloballyEnabled}
          >
            <SessionContextProvider>
              <SidebarProvider>
                  <AppWrapper initialWidgetConfigs={WIDGET_CONFIGS}>
                    {children}
                  </AppWrapper>
              </SidebarProvider>
            </SessionContextProvider>
          </ThemeProvider>
        </BackgroundProvider>
      </body>
    </html>
  );
}