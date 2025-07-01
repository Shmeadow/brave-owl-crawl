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
  // Messages will be dynamically loaded or added here
  const messages: Message[] = []; // Empty the messages array for a clean start

  return (
    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-md border-border">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
            ) : (
              messages.map((message) => (
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
              ))
            )}
          </div>
        </ScrollArea>
        {/* Removed the "Invite your friends..." text */}
      </CardContent>
      <CardFooter className="p-4 border-t border-border">
        <div className="flex w-full items-center space-x-2">
          <Input placeholder="Type your message..." className="flex-1 bg-input/50 border-border focus:border-primary" />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send Message</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}