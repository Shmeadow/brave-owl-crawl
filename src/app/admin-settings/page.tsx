"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full py-8">
      <h1 className="text-3xl font-bold text-foreground text-center">Admin Settings</h1>
      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">Application Configuration</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>This is where global application settings, such as theme colors and default behaviors, can be configured by an administrator.</p>
        </CardContent>
      </Card>
    </div>
  );
}