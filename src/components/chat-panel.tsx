"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSupabase } from "@/integrations/supabase/auth";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer"; // Import Drawer components

interface Message {
  id: string;
  user_id: string;
  room_id: string;
  author: string;
  content: string;
  created_at: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onNewUnreadMessage: () => void;
  onClearUnreadMessages: () => void;
  unreadCount: number;
  currentRoomId: string | null;
  isCurrentRoomWritable: boolean;
  isMobile: boolean; // New prop
}

export function ChatPanel({ isOpen, onToggleOpen, onNewUnreadMessage, onClearUnreadMessages, unreadCount, currentRoomId, isCurrentRoomWritable, isMobile }: ChatPanelProps) {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSupportContact, setShowSupportContact] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (roomId: string) => {
    if (!supabase) {
      // console.warn("Supabase client not available for fetching messages."); // Removed for cleaner logs
      toast.error("Chat unavailable: Supabase client not initialized.");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, user_id, room_id, content, created_at')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching messages from Supabase:", error.message, "Details:", error.details, "Hint:", error.hint);
        toast.error("Failed to load chat messages: " + error.message);
      } else if (data) {
        const formattedMessages = data.map(msg => {
          const authorName = (profile && profile.id === msg.user_id)
            ? (profile.first_name || profile.last_name || 'You')
            : msg.user_id?.substring(0, 8) || 'Guest';
          return {
            id: msg.id,
            user_id: msg.user_id,
            room_id: msg.room_id,
            content: msg.content,
            created_at: msg.created_at,
            author: authorName,
          };
        });
        setMessages(formattedMessages);
      }
    } catch (networkError: any) {
      console.error("Network error fetching chat messages:", networkError);
      toast.error("Failed to connect to chat server. Please check your internet connection or Supabase URL.");
    }
  }, [supabase, profile]);

  useEffect(() => {
    if (authLoading || !supabase || !currentRoomId) return;

    fetchMessages(currentRoomId);

    const channelName = `chat_room_${currentRoomId}`;
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${currentRoomId}` }, async (payload) => {
        const newMsg = payload.new as Message;
        
        const authorName = (profile && profile.id === newMsg.user_id)
          ? (profile.first_name || profile.last_name || 'You')
          : newMsg.user_id?.substring(0, 8) || 'Guest';

        const formattedNewMsg = {
          id: newMsg.id,
          user_id: newMsg.user_id,
          room_id: newMsg.room_id,
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
      setMessages([]);
    };
  }, [supabase, isOpen, session?.user?.id, onNewUnreadMessage, profile, authLoading, currentRoomId, fetchMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!isCurrentRoomWritable) {
      toast.error("You do not have permission to send messages in this room.");
      return;
    }
    if (!currentRoomId) {
      toast.error("Please select a room to chat in.");
      return;
    }
    if (inputMessage.trim() && supabase) {
      const userId = session?.user?.id || null;
      const { error } = await supabase.from('chat_messages').insert({
        user_id: userId,
        room_id: currentRoomId,
        content: inputMessage.trim(),
      });

      if (error) {
        console.error("Error sending message:", error);
        if (error.code === '42501') {
          toast.error("Failed to send message. You might not have permission to chat in this room. Please log in or join the room.");
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
    if (!isOpen) {
      onClearUnreadMessages();
    }
  };

  // Render logic based on isMobile
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onToggleOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="relative h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-300 ease-in-out"
            title="Open Chat"
          >
            <MessageSquare className="h-7 w-7" />
            <span className="sr-only">Open Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[80vh] flex flex-col">
          <DrawerHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
            <DrawerTitle className="text-lg">
              {showSupportContact ? "Contact Support" : `Chat: ${currentRoomId ? currentRoomId.substring(0, 8) + '...' : 'No Room Selected'}`}
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleOpen}
              title="Close Chat"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close Chat</span>
            </Button>
          </DrawerHeader>
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            {showSupportContact ? (
              <div className="flex flex-col items-center justify-center h-full text-sm text-muted-foreground space-y-4 text-center">
                <MessageSquare className="h-12 w-12 text-primary" />
                <p>Have a bug to report or a feature request?</p>
                <p>
                  Reach out to the owner at:{" "}
                  <a
                    href="mailto:support@cozyhub.app"
                    className="text-primary hover:underline"
                  >
                    support@cozyhub.app
                  </a>
                </p>
                <p>We appreciate your feedback!</p>
                <Button onClick={handleBackToChat} className="w-full">Back to Chat</Button>
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {!currentRoomId ? (
                    <p className="text-center text-muted-foreground text-sm">Please select a room in the &apos;Spaces&apos; widget to start chatting.</p>
                  ) : messages.length === 0 ? (
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
                            "max-w-[70%] p-3 rounded-lg backdrop-blur-xl",
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
          </div>
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
                  disabled={!currentRoomId || !isCurrentRoomWritable}
                />
                <Button type="submit" size="icon" onClick={handleSendMessage} disabled={!currentRoomId || !isCurrentRoomWritable}>
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
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop rendering
  return (
    <Card className={cn(
      "fixed bottom-4 right-4 h-[400px] w-80 flex flex-col bg-card/40 backdrop-blur-xl border-white/20 z-[900]",
      "transition-all duration-300 ease-in-out",
      !isOpen && "hidden" // Hide if not open
    )}>
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {showSupportContact ? "Contact Support" : `Chat: ${currentRoomId ? currentRoomId.substring(0, 8) + '...' : 'No Room Selected'}`}
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
                href="mailto:support@cozyhub.app"
                className="text-primary hover:underline"
              >
                support@cozyhub.app
              </a>
            </p>
            <p>We appreciate your feedback!</p>
            <Button onClick={handleBackToChat} className="w-full">Back to Chat</Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {!currentRoomId ? (
                <p className="text-center text-muted-foreground text-sm">Please select a room in the &apos;Spaces&apos; widget to start chatting.</p>
              ) : messages.length === 0 ? (
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
                        "max-w-[70%] p-3 rounded-lg backdrop-blur-xl",
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
              disabled={!currentRoomId || !isCurrentRoomWritable}
            />
            <Button type="submit" size="icon" onClick={handleSendMessage} disabled={!currentRoomId || !isCurrentRoomWritable}>
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