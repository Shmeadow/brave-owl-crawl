import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionContextProvider } from "@/integrations/supabase/auth"; // Import the context provider
import { redirect } from "next/navigation";
import { supabase } from "@/integrations/supabase/client"; // Import supabase client

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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session && !['/login'].includes(location.pathname)) { // Check if not logged in and not on login page
    redirect('/login');
  } else if (session && ['/login'].includes(location.pathname)) { // Check if logged in and on login page
    redirect('/');
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
        >
          <SessionContextProvider>
            {children}
          </SessionContextProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}