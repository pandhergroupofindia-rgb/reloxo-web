'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const CHATS_COLLECTION_ID = 'chats';

export default function ChatDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isBot = id === 'relox_bot';
  const chatTitle = isBot ? "Relox Official" : `@${id.toString().slice(0, 10)}`;

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
      // Create user message
      const userMsg = await databases.createDocument(DATABASE_ID, CHATS_COLLECTION_ID, ID.unique(), {
        senderId: user.$id,
        receiverId: id.toString(),
        text: text,
      });

      setMessages(prev => [...prev, userMsg]);

      // Bot Auto-Reply Logic
      if (isBot) {
        setTimeout(async () => {
          const botText = "Thanks for reaching out! A human agent will get back to you soon. Keep Vibe-ing! 🚀";
          const botMsg = await databases.createDocument(DATABASE_ID, CHATS_COLLECTION_ID, ID.unique(), {
            senderId: 'relox_bot',
            receiverId: user.$id,
            text: botText,
          });
          setMessages(prev => [...prev, botMsg]);
        }, 1500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/80 backdrop-blur-xl z-20">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          {isBot && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 p-0.5 flex items-center justify-center">
              <div className="bg-black w-full h-full rounded-full flex items-center justify-center font-bold text-sm">R</div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-sm">{chatTitle}</h1>
              {isBot && <CheckCircle2 className="w-3 h-3 text-green-500 fill-green-500/20" />}
            </div>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Online</p>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.$id} 
                className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm",
                  msg.senderId === user.$id 
                    ? "ml-auto bg-primary text-black font-medium rounded-tr-none" 
                    : "mr-auto bg-white/10 text-white rounded-tl-none"
                )}
              >
                {msg.text}
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      <form onSubmit={sendMessage} className="p-4 bg-black/80 border-t border-white/5 flex gap-2">
        <Input 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="bg-white/5 border-white/10 rounded-full h-12 px-6 focus-visible:ring-primary"
        />
        <Button 
          type="submit" 
          disabled={!newMessage.trim() || isSending}
          className="w-12 h-12 rounded-full bg-primary text-black"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-5 h-5" />}
        </Button>
      </form>
    </div>
  );
}