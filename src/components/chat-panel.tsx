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
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSupportContact, setShowSupportContact] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!supabase) {
      console.warn("Supabase client not available for fetching messages.");
      toast.error("Chat unavailable: Supabase client not initialized.");
      return;
    }
    console.log("Attempting to fetch messages from Supabase URL:", supabase.supabaseUrl); // Added this line
    try {
      // Fetch messages without joining profiles initially for better reliability
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, user_id, content, created_at') // Removed profiles join
        .order('created_at', { ascending: true })
        .limit(50); // Limit to last 50 messages

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for an empty chat
        console.error("Error fetching messages from Supabase:", error.message, "Details:", error.details, "Hint:", error.hint); // Enhanced logging
        toast.error("Failed to load chat messages: " + error.message); // Added error.message for more detail
      } else if (data) {
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          user_id: msg.user_id,
          content: msg.content,
          created_at: msg.created_at,
          // Use truncated user_id as author if profile is not available or names are null
          author: profile?.id === msg.user_id ? (profile.first_name || profile.last_name || 'You') : msg.user_id?.substring(0, 8) || 'Guest', // Handle guest author
        }));
        setMessages(formattedMessages);
      }
    } catch (networkError: any) {
      console.error("Network error fetching chat messages:", networkError);
      toast.error("Failed to connect to chat server. Please check your internet connection or Supabase URL.");
    }
  };

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load before fetching messages or setting up subscription

    fetchMessages();

    // Setup subscription only if supabase is available
    if (!supabase) return; 

    const subscription = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const newMsg = payload.new as Message; // Payload won't have profiles directly
        
        // To get the author's name for the new message, we'd ideally fetch the profile.
        // For simplicity and to avoid re-introducing the original error, we'll use a placeholder.
        const authorName = profile?.id === newMsg.user_id ? (profile.first_name || profile.last_name || 'You') : newMsg.user_id?.substring(0, 8) || 'Guest';

        const formattedNewMsg = {
          id: newMsg.id,
          user_id: newMsg.user_id,
          content: newMsg.content,
          created_at: newMsg.created_at,
          author: authorName,
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
  }, [supabase, isOpen, session?.user?.id, onNewUnreadMessage, profile, authLoading]); // Added authLoading to dependencies

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
    if (inputMessage.trim() && supabase) { // Removed session?.user check
      const userId = session?.user?.id || null; // Use null for guests
      const { error } = await supabase.from('chat_messages').insert({
        user_id: userId, // This will be null for guests
        content: inputMessage.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        // Inform the user about the RLS limitation for guests
        if (error.code === '42501') { // PostgreSQL error code for insufficient privilege (RLS)
          toast.error("Failed to send message. Guests cannot send messages due to security settings. Please log in.");
        } else {
          toast.error("Failed to send message: " + error.message);
        }
      } else {
        setInputMessage("");
      }
    } else if (!supabase) {
      toast.error("Chat is not available. Supabase client not initialized.");
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
      "h-[400px] w-80 flex flex-col bg-card/40 backdrop-blur-xl border-white/20", // Applied glass effect here
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
                          ? "bg-primary/60 text-primary-foreground rounded-br-none backdrop-blur-md" // Added backdrop-blur-md
                          : "bg-muted/20 text-muted-foreground rounded-bl-none backdrop-blur-md" // Added backdrop-blur-md
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