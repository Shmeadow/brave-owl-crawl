import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { createClient } from '@supabase/supabase-js';
import { AppWrapper } from "@/components/app-wrapper"; // Import AppWrapper

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side Supabase client for fetching app settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let isCozyThemeGloballyEnabled = true; // Default to true

  if (supabaseUrl && supabaseAnonKey) {
    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabaseServer
      .from('app_settings')
      .select('is_cozy_theme_enabled')
      .single();

    if (error) {
      console.error("Error fetching server-side app settings:", error);
    } else if (data) {
      isCozyThemeGloballyEnabled = data.is_cozy_theme_enabled;
    }
  } else {
    console.warn('Supabase environment variables not set for server-side fetching.');
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          isCozyThemeGloballyEnabled={isCozyThemeGloballyEnabled}
        >
          <AppWrapper> {/* Wrap children and other client components */}
            {children}
          </AppWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}