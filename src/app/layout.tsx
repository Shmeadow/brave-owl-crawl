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

const initialWidgetConfigs = {
  "background-effects": { initialPosition: { x: 50, y: 50 }, initialWidth: 400, initialHeight: 500 },
  "sounds": { initialPosition: { x: 100, y: 100 }, initialWidth: 400, initialHeight: 500 },
  "calendar": { initialPosition: { x: 150, y: 150 }, initialWidth: 800, initialHeight: 600 },
  "timer": { initialPosition: { x: 200, y: 200 }, initialWidth: 300, initialHeight: 200 },
  "tasks": { initialPosition: { x: 250, y: 250 }, initialWidth: 400, initialHeight: 500 },
  "notes": { initialPosition: { x: 300, y: 300 }, initialWidth: 400, initialHeight: 500 },
  "media": { initialPosition: { x: 350, y: 350 }, initialWidth: 400, initialHeight: 500 },
  "games": { initialPosition: { x: 400, y: 400 }, initialWidth: 600, initialHeight: 700 },
  "flash-cards": { initialPosition: { x: 450, y: 450 }, initialWidth: 900, initialHeight: 700 },
  "goal-focus": { initialPosition: { x: 500, y: 500 }, initialWidth: 500, initialHeight: 600 },
  "spaces": { initialPosition: { x: 550, y: 550 }, initialWidth: 700, initialHeight: 600 },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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