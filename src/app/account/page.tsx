"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full py-8">
      <h1 className="text-3xl font-bold text-foreground text-center">Account Settings</h1>
      <Card className="w-full bg-card backdrop-blur-xl border-white/20">
        <CardHeader>
          <CardTitle className="text-foreground">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          <p>This is where you will be able to manage your account details, like your name, profile picture, and time format preferences.</p>
        </CardContent>
      </Card>
    </div>
  );
}