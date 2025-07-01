"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";

interface Message {
  id: string;
  user_id: string;
  author: string; // This will be derived from profile or user ID
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onNewUnreadMessage: () => void; // Callback for new unread messages
  onClearUnreadMessages: () => void; // Callback to clear unread messages
  unreadCount: number; // Current unread count
}

export function ChatPanel({ isOpen, onToggleOpen, onNewUnreadMessage, onClearUnreadMessages, unreadCount }: ChatPanelProps) {
  const { supabase, session, profile } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSupportContact, setShowSupportContact] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, user_id, content, created_at, profiles(first_name, last_name)')
      .order('created_at', { ascending: true })
      .limit(50); // Limit to last 50 messages

    if (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load chat messages.");
    } else {
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        content: msg.content,
        created_at: msg.created_at,
        author: msg.profiles ? `${msg.profiles.first_name || ''} ${msg.profiles.last_name || ''}`.trim() || msg.user_id.substring(0, 8) : msg.user_id.substring(0, 8),
      }));
      setMessages(formattedMessages);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (!supabase) return;

    const subscription = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const newMsg = payload.new as Message & { profiles: { first_name: string, last_name: string } };
        const formattedNewMsg = {
          id: newMsg.id,
          user_id: newMsg.user_id,
          content: newMsg.content,
          created_at: newMsg.created_at,
          author: newMsg.profiles ? `${newMsg.profiles.first_name || ''} ${newMsg.profiles.last_name || ''}`.trim() || newMsg.user_id.substring(0, 8) : newMsg.user_id.substring(0, 8),
        };
        setMessages((prevMessages) => [...prevMessages, formattedNewMsg]);
        if (!isOpen && newMsg.user_id !== session?.user?.id) {
          onNewUnreadMessage();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, isOpen, session?.user?.id, onNewUnreadMessage]);

  useEffect(() => {
    // Scroll to bottom when messages change or chat opens
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() && session?.user && supabase) {
      const { error } = await supabase.from('chat_messages').insert({
        user_id: session.user.id,
        content: inputMessage.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message.");
      } else {
        setInputMessage("");
      }
    }
  };

  const handleContactSupport = () => {
    setShowSupportContact(true);
  };

  const handleBackToChat = () => {
    setShowSupportContact(false);
  };

  const handleToggleOpenAndClearUnread = () => {
    onToggleOpen();
    if (!isOpen) { // If opening the chat
      onClearUnreadMessages();
    }
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 ease-in-out"
          onClick={handleToggleOpenAndClearUnread}
          title="Open Chat"
        >
          <MessageSquare className="h-7 w-7" />
          <span className="sr-only">Open Chat</span>
        </Button>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={cn(
      "h-[400px] w-80 flex flex-col bg-card/80 backdrop-blur-md border-border",
      "transition-all duration-300 ease-in-out"
    )}>
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {showSupportContact ? "Contact Support" : "Chat"}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleToggleOpenAndClearUnread}
          title="Close Chat"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close Chat</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
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
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.user_id === session?.user?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] p-3 rounded-lg",
                        message.user_id === session?.user?.id
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      )}
                    >
                      {message.user_id !== session?.user?.id && (
                        <p className="text-xs font-semibold mb-1">{message.author}</p>
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t border-border flex flex-col gap-2">
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
        {!showSupportContact && (
          <Button variant="link" className="text-xs text-muted-foreground" onClick={handleContactSupport}>
            Contact Support
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}