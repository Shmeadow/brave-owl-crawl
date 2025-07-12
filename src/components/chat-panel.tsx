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
  DrawerTrigger,
} from "@/components/ui/drawer";

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
  isMobile: boolean;
}

export function ChatPanel({ isOpen, onToggleOpen, onNewUnreadMessage, onClearUnreadMessages, unreadCount, currentRoomId, isCurrentRoomWritable, isMobile }: ChatPanelProps) {
  const { supabase, session, profile, loading: authLoading } = useSupabase();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSupportContact, setShowSupportContact] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (roomId: string) => {
    if (!supabase) return;
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error && error.code !== 'PGRST116') throw error;
      
      if (messagesData) {
        const userIds = [...new Set(messagesData.map(msg => msg.user_id).filter(Boolean))];
        let profilesMap = new Map();

        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', userIds);
          if (profilesError) console.error("Error fetching profiles for chat:", profilesError);
          else profilesMap = new Map(profilesData?.map(p => [p.id, p]));
        }

        const formattedMessages = messagesData.map(msg => {
          const senderProfile = profilesMap.get(msg.user_id);
          const authorName = (profile && profile.id === msg.user_id)
            ? (profile.first_name || 'You')
            : (senderProfile?.first_name || `User...`);
          return { ...msg, author: authorName };
        });
        setMessages(formattedMessages);
      }
    } catch (error: any) {
      toast.error("Failed to load chat messages: " + error.message);
      console.error("Error fetching messages:", error);
    }
  }, [supabase, profile]);

  useEffect(() => {
    if (authLoading || !supabase || !currentRoomId) return;
    fetchMessages(currentRoomId);
    const channel = supabase
      .channel(`chat_room_${currentRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${currentRoomId}` }, 
      (payload) => {
        fetchMessages(currentRoomId); // Refetch to get profile info
        if (!isOpen && payload.new.user_id !== session?.user?.id) {
          onNewUnreadMessage();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, isOpen, session?.user?.id, onNewUnreadMessage, authLoading, currentRoomId, fetchMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
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
    if (inputMessage.trim() && supabase && session) {
      const { error } = await supabase.from('chat_messages').insert({
        user_id: session.user.id,
        room_id: currentRoomId,
        content: inputMessage.trim(),
      });
      if (error) toast.error("Failed to send message: " + error.message);
      else setInputMessage("");
    }
  };

  const handleToggleOpenAndClearUnread = () => {
    onToggleOpen();
    if (!isOpen) onClearUnreadMessages();
  };

  const chatContent = (
    <>
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        {showSupportContact ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <p>Contact support at <a href="mailto:support@cozyhub.app" className="text-primary">support@cozyhub.app</a></p>
            <Button onClick={() => setShowSupportContact(false)}>Back to Chat</Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {!currentRoomId ? (
                <p className="text-center text-muted-foreground text-sm">Select a room to start chatting.</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm">No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={cn("flex", message.user_id === session?.user?.id ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] p-3 rounded-lg", message.user_id === session?.user?.id ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {message.user_id !== session?.user?.id && <p className="text-xs font-semibold mb-1">{message.author}</p>}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </div>
      <CardFooter className="p-4 border-t flex flex-col gap-2">
        {!showSupportContact && (
          <div className="flex w-full items-center space-x-2">
            <Input placeholder="Type a message..." value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} disabled={!currentRoomId || !isCurrentRoomWritable} />
            <Button type="submit" size="icon" onClick={handleSendMessage} disabled={!currentRoomId || !isCurrentRoomWritable}><Send className="h-4 w-4" /></Button>
          </div>
        )}
        {!showSupportContact && <Button variant="link" className="text-xs" onClick={() => setShowSupportContact(true)}>Contact Support</Button>}
      </CardFooter>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onToggleOpen}>
        <DrawerTrigger asChild>
          <Button variant="default" size="icon" className="relative h-14 w-14 rounded-full shadow-lg"><MessageSquare className="h-7 w-7" />{unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">{unreadCount}</span>}</Button>
        </DrawerTrigger>
        <DrawerContent className="h-[80vh] flex flex-col">
          <DrawerHeader className="p-4 border-b flex justify-between items-center"><DrawerTitle>{showSupportContact ? "Contact Support" : "Chat"}</DrawerTitle><Button variant="ghost" size="icon" onClick={onToggleOpen}><X className="h-5 w-5" /></Button></DrawerHeader>
          {chatContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Card className={cn("fixed bottom-4 right-4 h-[400px] w-80 flex flex-col bg-card/40 backdrop-blur-xl z-[900]", !isOpen && "hidden")}>
      <CardHeader className="p-4 border-b flex justify-between items-center"><CardTitle>{showSupportContact ? "Contact Support" : "Chat"}</CardTitle><Button variant="ghost" size="icon" onClick={handleToggleOpenAndClearUnread}><X className="h-5 w-5" /></Button></CardHeader>
      {chatContent}
    </Card>
  );
}