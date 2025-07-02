"use client";

import React, { useEffect } from "react";
import { useSupabase } from "@/integrations/supabase/auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/hooks/use-app-settings";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const { session, loading: authLoading } = useSupabase();
  const { settings, loading: settingsLoading, isAdmin, updateSetting } = useAppSettings();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !settingsLoading && !isAdmin) {
      toast.error("Access Denied: You must be an admin to view this page.");
      router.push('/'); // Redirect non-admins
    }
  }, [authLoading, settingsLoading, isAdmin, router]);

  if (authLoading || settingsLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <p className="text-foreground">Loading admin settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <p className="text-foreground">Error: Could not load application settings.</p>
      </div>
    );
  }

  const handleToggleCozyTheme = (checked: boolean) => {
    updateSetting('is_cozy_theme_enabled', checked);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full">
      <Card className="w-full bg-card backdrop-blur-xl border-white/20"> {/* Removed /40 */}
        <CardHeader>
          <CardTitle className="text-foreground">Admin Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground">
          <div className="flex items-center justify-between">
            <Label htmlFor="cozy-theme-toggle" className="text-base">
              Enable Cozy Theme (with background image)
            </Label>
            <Switch
              id="cozy-theme-toggle"
              checked={settings.is_cozy_theme_enabled}
              onCheckedChange={handleToggleCozyTheme}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            When enabled, the &quot;Cozy&quot; theme will be available in the theme selector.
            When disabled, the &quot;Cozy&quot; theme will be hidden.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}