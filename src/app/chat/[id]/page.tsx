'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Send, CheckCircle2, Loader2, MoreVertical, Search, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const CHATS_COLLECTION_ID = 'chats';

export default function ChatDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBot = id === 'relox_bot';

  useEffect(() => {
    if (user && id) {
      fetchTargetUser();
      fetchMessages();
    }
  }, [user, id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchTargetUser = async () => {
    if (isBot) {
      setTargetUser({
        name: "Relox Official",
        username: "@relox_official",
        photoURL: "",
        isVerified: true,
        $id: 'relox_bot'
      });
      return;
    }
    try {
      const doc = await databases.getDocument(DATABASE_ID, 'users', id.toString());
      const profile = JSON.parse(doc.profileData || '{}');
      setTargetUser({ ...doc, ...profile, $id: id.toString() });
    } catch (e) {
      console.error("Error fetching target user:", e);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, CHATS_COLLECTION_ID, [
        Query.or([
          Query.and([Query.equal('senderId', user.$id), Query.equal('receiverId', id.toString())]),
          Query.and([Query.equal('senderId', id.toString()), Query.equal('receiverId', user.$id)])
        ]),
        Query.orderAsc('$createdAt'),
        Query.limit(100)
      ]);
      setMessages(response.documents);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const text = newMessage;
    setNewMessage('');

    try {
      const msgData = {
        senderId: user.$id,
        receiverId: id.toString(),
        text: text,
      };

      const userMsg = await databases.createDocument(DATABASE_ID, CHATS_COLLECTION_ID, ID.unique(), msgData);
      setMessages(prev => [...prev, userMsg]);

      if (isBot) {
        setTimeout(async () => {
          const botReply = {
            senderId: 'relox_bot',
            receiverId: user.$id,
            text: "Thanks for reaching out! A Relox support agent will assist you shortly. Keep Vibe-ing! 🚀",
          };
          const botMsgDoc = await databases.createDocument(DATABASE_ID, CHATS_COLLECTION_ID, ID.unique(), botReply);
          setMessages(prev => [...prev, botMsgDoc]);
        }, 1200);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white">
      {/* WhatsApp Style Header */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-black/80 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => !isBot && router.push(`/profile?id=${id}`)}>
            <div className="relative">
              <Avatar className="w-10 h-10 border border-white/10 ring-1 ring-primary/20">
                <AvatarImage src={targetUser?.photoURL || (isBot ? "" : `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.displayName || 'U')}&background=33F0FF&color=000`)} />
                <AvatarFallback className="bg-zinc-900">{targetUser?.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-sm tracking-tight">{targetUser?.displayName || targetUser?.name || 'Loading...'}</h1>
                {targetUser?.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />}
              </div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-80 animate-pulse">Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-50">
          <Button variant="ghost" size="icon" className="rounded-full"><Video className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </header>

      {/* Message Area */}
      <ScrollArea className="flex-1 bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-fixed relative">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full p-12 gap-3 relative z-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Syncing Vibes...</p>
          </div>
        ) : (
          <div className="p-4 space-y-4 relative z-10 min-h-full flex flex-col justify-end">
            <div className="text-center py-8 opacity-20">
              <p className="text-[9px] uppercase tracking-[0.4em] font-bold">Encrypted Vibe Channel</p>
            </div>
            
            {messages.map((msg) => (
              <div 
                key={msg.$id} 
                className={cn(
                  "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.senderId === user.$id ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div 
                  className={cn(
                    "p-3 rounded-2xl text-sm shadow-xl",
                    msg.senderId === user.$id 
                      ? "bg-primary text-black font-medium rounded-tr-none shadow-primary/10" 
                      : "bg-white/10 text-white backdrop-blur-md border border-white/5 rounded-tl-none"
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[8px] mt-1 text-muted-foreground uppercase font-bold tracking-tighter">
                  {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Bar */}
      <div className="p-4 bg-black/95 border-t border-white/5 sticky bottom-0">
        <form onSubmit={sendMessage} className="flex gap-2 items-center">
          <div className="flex-1 relative group">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Vibe check..."
              className="bg-white/5 border-white/10 rounded-full h-12 pl-6 pr-12 focus-visible:ring-primary focus-visible:border-primary text-sm placeholder:text-muted-foreground/50 transition-all group-focus-within:bg-white/10"
              disabled={isSending}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
          </div>
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className="w-12 h-12 rounded-full bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(51,240,255,0.3)] active:scale-90 transition-transform"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
