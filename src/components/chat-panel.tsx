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
  user_id: string; // Can be a guest ID or Supabase user ID
  author: string;
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

const LOCAL_STORAGE_KEY_CHAT = 'guest_chat_messages';

export function ChatPanel({ isOpen, onToggleOpen, onNewUnreadMessage, onClearUnreadMessages, unreadCount }: ChatPanelProps) {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSupportContact, setShowSupportContact] = useState(false);
  const [isLoggedInMode, setIsLoggedInMode] = useState(false); // New state to track mode
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Effect to handle initial load and auth state changes
  useEffect(() => {
    if (authLoading) return;

    const loadMessages = async () => {
      if (session && supabase) {
        // User is logged in
        setIsLoggedInMode(true);
        console.log("User logged in. Checking for local chat messages to migrate...");

        // 1. Load local messages (if any)
        const localMessagesString = localStorage.getItem(LOCAL_STORAGE_KEY_CHAT);
        let localMessages: Message[] = [];
        try {
          localMessages = localMessagesString ? JSON.parse(localMessagesString) : [];
        } catch (e) {
          console.error("Error parsing local storage chat messages:", e);
          localMessages = [];
        }

        // 2. Fetch user's existing messages from Supabase
        const { data: supabaseMessages, error: fetchError } = await supabase
          .from('chat_messages')
          .select('id, user_id, content, created_at')
          .order('created_at', { ascending: true })
          .limit(50);

        if (fetchError) {
          toast.error("Error fetching chat messages from Supabase: " + fetchError.message);
          console.error("Error fetching messages (Supabase):", fetchError);
          setMessages([]);
        } else {
          let mergedMessages = [...(supabaseMessages as Message[])];

          // 3. Migrate local messages to Supabase if they don't already exist
          if (localMessages.length > 0) {
            console.log(`Found ${localMessages.length} local messages. Attempting migration...`);
            for (const localMsg of localMessages) {
              // Check if a similar message (by content and approximate time) already exists in Supabase
              const existsInSupabase = mergedMessages.some(
                sm => sm.content === localMsg.content && Math.abs(new Date(sm.created_at).getTime() - new Date(localMsg.created_at).getTime()) < 5000 // within 5 seconds
              );

              if (!existsInSupabase) {
                const { data: newSupabaseMsg, error: insertError } = await supabase
                  .from('chat_messages')
                  .insert({
                    user_id: session.user.id, // Assign to logged-in user
                    content: localMsg.content,
                    created_at: localMsg.created_at || new Date().toISOString(),
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error("Error migrating local message to Supabase:", insertError);
                  toast.error("Error migrating some local chat messages.");
                } else if (newSupabaseMsg) {
                  mergedMessages.push(newSupabaseMsg as Message);
                  console.log("Migrated local message:", newSupabaseMsg.content);
                }
              }
            }
            // Clear local storage after migration attempt
            localStorage.removeItem(LOCAL_STORAGE_KEY_CHAT);
            toast.success("Local chat messages migrated to your account!");
          }
          // Format messages with correct authors after merge
          const formattedMessages = mergedMessages.map(msg => ({
            ...msg,
            author: profile?.id === msg.user_id ? (profile.first_name || profile.last_name || 'You') : msg.user_id.substring(0, 8),
          }));
          setMessages(formattedMessages);
        }
      } else {
        // User is a guest (not logged in)
        setIsLoggedInMode(false);
        const storedMessagesString = localStorage.getItem(LOCAL_STORAGE_KEY_CHAT);
        let loadedMessages: Message[] = [];
        try {
          loadedMessages = storedMessagesString ? JSON.parse(storedMessagesString) : [];
        } catch (e) {
          console.error("Error parsing local storage chat messages:", e);
          loadedMessages = [];
        }
        // For guest mode, assign a generic 'Guest' author
        const formattedGuestMessages = loadedMessages.map(msg => ({
          ...msg,
          author: 'Guest',
        }));
        setMessages(formattedGuestMessages);
        if (loadedMessages.length === 0) {
          toast.info("You are chatting as a guest. Your messages will be saved locally.");
        }
      }
    };

    loadMessages();
  }, [session, supabase, authLoading, profile]);

  // Effect to save messages to local storage when in guest mode
  useEffect(() => {
    if (!isLoggedInMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CHAT, JSON.stringify(messages));
    }
  }, [messages, isLoggedInMode]);

  // Supabase Realtime Subscription (only for logged-in users)
  useEffect(() => {
    if (!supabase || !session) {
      // If not logged in or supabase not available, no real-time subscription
      return;
    }

    const subscription = supabase
      .channel('chat_room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const newMsg = payload.new as Message;
        
        // Determine author for the new message
        const authorName = profile?.id === newMsg.user_id ? (profile.first_name || profile.last_name || 'You') : newMsg.user_id.substring(0, 8);

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
  }, [supabase, isOpen, session, onNewUnreadMessage, profile]); // Added session to dependencies

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
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) return;

    if (isLoggedInMode && session?.user && supabase) {
      const { error } = await supabase.from('chat_messages').insert({
        user_id: session.user.id,
        content: trimmedMessage,
      });

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message.");
      } else {
        setInputMessage("");
      }
    } else {
      // Guest mode
      const newGuestMessage: Message = {
        id: crypto.randomUUID(),
        user_id: `guest-${crypto.randomUUID().substring(0, 8)}`, // Unique ID for guest
        author: 'You (Guest)', // Explicitly mark as guest
        content: trimmedMessage,
        created_at: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, newGuestMessage]);
      setInputMessage("");
      toast.success("Message sent (saved locally)!");
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