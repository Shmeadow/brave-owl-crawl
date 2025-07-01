"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SpacesWidget() {
  return (
    <div className="h-full w-full">
      <div className="space-y-8 max-w-5xl mx-auto py-4">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Featured Spaces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Empty box 1 */}
            <Card className="relative h-48 overflow-hidden group bg-muted/20 backdrop-blur-md border border-border flex items-center justify-center text-muted-foreground">
              <span className="text-lg font-semibold">Space 1</span>
            </Card>
            {/* Empty box 2 */}
            <Card className="relative h-48 overflow-hidden group bg-muted/20 backdrop-blur-md border border-border flex items-center justify-center text-muted-foreground">
              <span className="text-lg font-semibold">Space 2</span>
            </Card>
            {/* Empty box 3 */}
            <Card className="relative h-48 overflow-hidden group bg-muted/20 backdrop-blur-md border border-border flex items-center justify-center text-muted-foreground">
              <span className="text-lg font-semibold">Space 3</span>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Recommended Spaces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Empty boxes for recommended spaces */}
            {Array.from({ length: 14 }).map((_, index) => (
              <Card key={index} className="relative h-48 overflow-hidden group bg-muted/20 backdrop-blur-md border border-border flex items-center justify-center text-muted-foreground">
                <span className="text-lg font-semibold">Space {index + 4}</span>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}