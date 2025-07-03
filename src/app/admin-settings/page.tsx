"use client";

import React from "react";
import { useAppSettings } from "@/hooks/use-app-settings";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { Loader2 } from "lucide-react";

export default function AdminSettingsPage() {
  const { isAdmin, loading } = useAppSettings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full py-8">
      <h1 className="text-3xl font-bold text-foreground text-center">Admin Settings</h1>
      {isAdmin ? (
        <AdminSettingsForm />
      ) : (
        <p className="text-destructive text-center">
          You do not have permission to view this page.
        </p>
      )}
    </div>
  );
}