"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SpotifyEmbedDisplay } from "@/components/spotify-embed-display"; // Import SpotifyEmbedDisplay
import { useAppWrapperContext } from "@/components/app-wrapper"; // Import context to get modal handler

export default function Home() {
  const { session, loading } = useSupabase();
  const { setIsSpotifyModalOpen } = useAppWrapperContext(); // Get the setter for Spotify modal

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 items-center sm:items-start">
        <h1 className="text-2xl font-bold text-white">Welcome to your Productivity Hub!</h1>
        <p className="text-white/80">
          Use the sidebar to navigate between your tools.
        </p>
        {!loading && !session && (
          <p className="text-sm text-white/70">
            You are currently browsing as a guest. Some features may require you to log in.
          </p>
        )}
        <SpotifyEmbedDisplay onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)} /> {/* Add SpotifyEmbedDisplay */}
      </div>
      <MadeWithDyad />
    </DashboardLayout>
  );
}