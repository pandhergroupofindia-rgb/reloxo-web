'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Bell, Search, CheckCircle2, User, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const CHATS_COLLECTION_ID = 'chats';

export default function InboxPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      // In a real app, we'd fetch from Appwrite 'chats' table
      // const response = await databases.listDocuments(DATABASE_ID, CHATS_COLLECTION_ID, [
      //   Query.or([Query.equal('senderId', user.$id), Query.equal('receiverId', user.$id)]),
      //   Query.orderDesc('$createdAt')
      // ]);
      // setChats(response.documents);
      
      // Mocking empty state to trigger bot logic as requested
      setChats([]);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-xl z-20">
        <h1 className="text-2xl font-headline font-bold neon-text">Inbox</h1>
        <div className="flex gap-4">
          <Search className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-white transition-colors" />
          <div className="relative">
            <Bell className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-white transition-colors" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          </div>
        </div>
      </header>

      <Tabs defaultValue="messages" className="w-full flex-1 flex flex-col">
        <TabsList className="w-full bg-black border-b border-white/5 rounded-none p-0 h-14">
          <TabsTrigger value="messages" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all uppercase tracking-[0.2em] text-[10px] font-bold">
            Messages
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all uppercase tracking-[0.2em] text-[10px] font-bold">
            Activity
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="flex-1 m-0">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : chats.length === 0 ? (
              <div className="p-2">
                {/* Relox Official Bot Message */}
                <div className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-0.5 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
                      <div className="bg-black w-full h-full rounded-full flex items-center justify-center overflow-hidden">
                        <span className="text-primary font-headline font-bold text-lg">R</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-black">
                      <CheckCircle2 className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm">Relox Official</span>
                        <CheckCircle2 className="w-3 h-3 text-green-500 fill-green-500/20" />
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase">Now</span>
                    </div>
                    <p className="text-xs text-white/70 line-clamp-1 italic">
                      Welcome to the Relox family! 🚀 Share your vibe and become a star!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {chats.map((chat) => (
                  <div key={chat.$id} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer">
                    <Avatar className="w-14 h-14 border border-white/10">
                      <AvatarImage src={chat.userPhoto} />
                      <AvatarFallback className="bg-zinc-900">{chat.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">{chat.username}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">2h ago</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{chat.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 m-0 flex flex-col items-center justify-center p-12 text-center opacity-40">
          <Bell className="w-16 h-16 mb-6 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] mb-2">No notifications yet</h2>
          <p className="text-xs text-muted-foreground max-w-[200px]">When someone follows or likes you, you'll see it here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
