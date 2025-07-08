import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { SupabaseAuthProvider } from "@/integrations/supabase/auth";
import { AppWrapper } from "./app-wrapper";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "CozyHub",
  description: "Your personal productivity dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialWidgetConfigs = {}; // This will be populated later if needed
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <body>
        <SupabaseAuthProvider>
          <Providers>
            <AppWrapper initialWidgetConfigs={initialWidgetConfigs}>
              {children}
            </AppWrapper>
          </Providers>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}