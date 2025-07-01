"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  author: string;
  text: string;
  isUser: boolean;
}

export function ChatPanel() {
  const messages: Message[] = [
    { id: "1", author: "@PlanetCalm", text: "Hey everyone, welcome to Shmeadow's Room!", isUser: false },
    { id: "2", author: "You", text: "Hi! This space is awesome!", isUser: true },
    { id: "3", author: "@ChillVibes", text: "Loving the lofi beats today!", isUser: false },
    { id: "4", author: "@StudyBuddy", text: "Anyone else working on flashcards?", isUser: false },
    { id: "5", author: "You", text: "Yep, just added a few new ones!", isUser: true },
  ];

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-md border-border">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] p-3 rounded-lg",
                    message.isUser
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted text-muted-foreground rounded-bl-none"
                  )}
                >
                  {!message.isUser && (
                    <p className="text-xs font-semibold mb-1">{message.author}</p>
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 p-2 bg-card/80 backdrop-blur-md rounded-md text-center text-sm text-muted-foreground">
          <p>Invite your friends and start chatting! 👋</p>
          <p>Share your room link here.</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t border-border">
        <div className="flex w-full items-center space-x-2">
          <Input placeholder="Say something..." className="flex-1 bg-input/50 border-border focus:border-primary" />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send Message</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}