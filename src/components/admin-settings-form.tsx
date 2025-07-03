"use client";

import React from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function AdminSettingsForm() {
  const { settings, loading, updateSetting } = useAppSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-destructive">Could not load application settings.</p>;
  }

  return (
    <Card className="w-full bg-card backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle>Theme Settings</CardTitle>
        <CardDescription>
          These settings affect all users of the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="cozy-theme-toggle" className="font-medium">
              Enable &quot;Cozy&quot; Theme
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow users to select the custom Cozy theme from the theme picker.
            </p>
          </div>
          <Switch
            id="cozy-theme-toggle"
            checked={settings.is_cozy_theme_enabled}
            onCheckedChange={(checked) => updateSetting('is_cozy_theme_enabled', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}