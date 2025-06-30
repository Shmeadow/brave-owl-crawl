import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionContextProvider } from "@/integrations/supabase/auth";
import { redirect } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { headers } from 'next/headers'; // Import headers

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
  const headersList = await headers(); // Await the headers() call
  const pathname = headersList.get('x-pathname') || '/'; // Get the pathname from headers

  if (!session && pathname !== '/login') {
    redirect('/login');
  } else if (session && pathname === '/login') {
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