"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContactWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <Button
          size="icon"
          className="rounded-full h-12 w-12 shadow-lg"
          onClick={toggleOpen}
          title="Contact Us"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="sr-only">Open Contact Widget</span>
        </Button>
      )}

      {isOpen && (
        <Card className="w-72 shadow-lg bg-background/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
            <h3 className="text-md font-semibold">Contact Us</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleOpen}
              title="Close"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close Contact Widget</span>
            </Button>
          </CardHeader>
          <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
            <p>Have a bug to report or a feature request?</p>
            <p>
              Reach out to the owner at:{" "}
              <a
                href="mailto:support@example.com"
                className="text-primary hover:underline"
              >
                support@example.com
              </a>
            </p>
            <p>We appreciate your feedback!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}