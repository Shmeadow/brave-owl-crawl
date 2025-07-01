"use client";

import React, { useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-full py-8">
          <p>Loading admin settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full py-8">
          <p>Error: Could not load application settings.</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleToggleCozyTheme = (checked: boolean) => {
    updateSetting('is_cozy_theme_enabled', checked);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              When enabled, the "Cozy" theme will be available in the theme selector.
              When disabled, the "Cozy" theme will be hidden.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}