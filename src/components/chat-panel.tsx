"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ChevronLeft, ChevronRight, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLofiAudio } from "@/hooks/use-lofi-audio"; // Import useLofiAudio hook
import { LofiAudioPlayer } from "@/components/lofi-audio-player"; // Import the component

interface Message {
  id: string;
  author: string;
  text: string;
  isUser: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function ChatPanel({ isOpen, onToggleOpen }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]); // State for chat messages
  const [inputMessage, setInputMessage] = useState("");
  const [showSupportContact, setShowSupportContact] = useState(false); // New state for support contact
  const { audioRef, isPlaying, togglePlayPause } = useLofiAudio(); // Use the lofi audio hook

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: Date.now().toString(), author: "You", text: inputMessage, isUser: true },
      ]);
      setInputMessage("");
      // Simulate a response for general chat
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: Date.now().toString() + "-bot", author: "Bot", text: "Thanks for your message! How can I help you further?", isUser: false },
        ]);
      }, 1000);
    }
  };

  const handleContactSupport = () => {
    setShowSupportContact(true);
  };

  const handleBackToChat = () => {
    setShowSupportContact(false);
  };

  return (
    <Card className={cn(
      "h-full flex flex-col bg-card/80 backdrop-blur-md border-border",
      "transition-all duration-300 ease-in-out",
      isOpen ? "w-80" : "w-12" // Adjust width based on isOpen
    )}>
      <CardHeader className={cn(
        "p-4 border-b border-border flex flex-row items-center justify-between",
        !isOpen && "justify-center" // Center icon when closed
      )}>
        {isOpen && (
          <CardTitle className="text-lg">
            {showSupportContact ? "Contact Support" : "Chat"}
          </CardTitle>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleOpen}
          title={isOpen ? "Minimize Chat" : "Expand Chat"}
        >
          {isOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          <span className="sr-only">{isOpen ? "Minimize Chat" : "Expand Chat"}</span>
        </Button>
      </CardHeader>
      <CardContent className={cn(
        "flex-1 p-4 overflow-hidden flex flex-col",
        !isOpen && "hidden" // Hide content when closed
      )}>
        {showSupportContact ? (
          <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground space-y-4 text-center">
            <MessageSquare className="h-12 w-12 text-primary" />
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
            <Button onClick={handleBackToChat} className="w-full">Back to Chat</Button>
          </div>
        ) : (
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
        )}
      </CardContent>
      <CardFooter className={cn(
        "p-4 border-t border-border flex flex-col gap-2",
        !isOpen && "hidden" // Hide footer when closed
      )}>
        {!showSupportContact && (
          <div className="flex w-full items-center space-x-2">
            <Input
              placeholder="Type your message..."
              className="flex-1 bg-input/50 border-border focus:border-primary"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
            />
            <Button type="submit" size="icon" onClick={handleSendMessage}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send Message</span>
            </Button>
          </div>
        )}
        {/* Lofi Audio Player Controls */}
        <div className="w-full flex justify-center">
          <Button
            size="icon"
            className="rounded-full h-10 w-10 shadow-lg"
            onClick={togglePlayPause}
            title={isPlaying ? "Pause Lofi Audio" : "Play Lofi Audio"}
          >
            {isPlaying ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            <span className="sr-only">{isPlaying ? "Pause Lofi Audio" : "Play Lofi Audio"}</span>
          </Button>
        </div>
        <LofiAudioPlayer /> {/* The actual audio element */}
        {!showSupportContact && (
          <Button variant="link" className="text-xs text-muted-foreground" onClick={handleContactSupport}>
            Contact Support
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}