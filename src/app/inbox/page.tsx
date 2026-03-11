
'use client';

import { MessageSquare, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InboxPage() {
  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="p-4 border-b border-white/5 flex items-center justify-between">
        <h1 className="text-xl font-headline font-bold neon-text">Inbox</h1>
      </header>

      <Tabs defaultValue="activity" className="w-full flex-1 flex flex-col">
        <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0 h-12">
          <TabsTrigger value="activity" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <Bell className="w-4 h-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mb-4 opacity-20" />
          <p>No new notifications yet.</p>
          <p className="text-xs mt-2">When someone interacts with you, it will appear here.</p>
        </TabsContent>
        <TabsContent value="messages" className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
          <p>Your DMs are empty.</p>
          <p className="text-xs mt-2">Start a conversation with a creator you love!</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
