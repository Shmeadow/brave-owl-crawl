"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Lock } from "lucide-react";

export function SoundsPanel() {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto h-full">
      <h1 className="text-3xl font-bold text-foreground">Ambient Sounds & Music</h1>

      <Card className="w-full bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Free Sounds</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
            <span className="font-medium">Rainy Day</span>
            <Button variant="ghost" size="icon">
              <Play className="h-5 w-5" />
              <span className="sr-only">Play Rainy Day</span>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
            <span className="font-medium">Forest Birds</span>
            <Button variant="ghost" size="icon">
              <Play className="h-5 w-5" />
              <span className="sr-only">Play Forest Birds</span>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
            <span className="font-medium">Ocean Waves</span>
            <Button variant="ghost" size="icon">
              <Play className="h-5 w-5" />
              <span className="sr-only">Play Ocean Waves</span>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
            <span className="font-medium">Gentle Wind</span>
            <Button variant="ghost" size="icon">
              <Play className="h-5 w-5" />
              <span className="sr-only">Play Gentle Wind</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Premium Sounds & Music</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50 opacity-70">
            <span className="font-medium">Cozy Fireplace</span>
            <Button variant="ghost" size="icon" disabled>
              <Lock className="h-5 w-5" />
              <span className="sr-only">Premium Content</span>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50 opacity-70">
            <span className="font-medium">Jazz Cafe</span>
            <Button variant="ghost" size="icon" disabled>
              <Lock className="h-5 w-5" />
              <span className="sr-only">Premium Content</span>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50 opacity-70">
            <span className="font-medium">Deep Space Drone</span>
            <Button variant="ghost" size="icon" disabled>
              <Lock className="h-5 w-5" />
              <span className="sr-only">Premium Content</span>
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50 opacity-70">
            <span className="font-medium">Zen Garden Stream</span>
            <Button variant="ghost" size="icon" disabled>
              <Lock className="h-5 w-5" />
              <span className="sr-only">Premium Content</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        Unlock premium sounds and features by upgrading your account!
      </p>
    </div>
  );
}