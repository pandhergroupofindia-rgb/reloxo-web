'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Grid, Heart, Bookmark, LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-black">
        <h2 className="text-xl font-headline font-bold mb-4 text-white">Profile not found</h2>
        <p className="text-muted-foreground mb-6">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="p-4 flex flex-col items-center gap-4 border-b border-white/5 pt-8">
        <div className="relative">
          <Avatar className="w-24 h-24 border-2 border-primary neon-border">
            <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.displayName || 'U')}&background=33F0FF&color=000`} alt={user.name} />
            <AvatarFallback className="bg-muted text-xl">{user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center">
          <h1 className="text-xl font-headline font-bold neon-text">{user.name || user.displayName}</h1>
          <p className="text-primary text-sm font-medium">{user.username || '@user'}</p>
        </div>

        <div className="flex gap-8 py-2">
          <div className="text-center">
            <p className="font-bold text-lg">0</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Following</p>
          </div>
          <div className="text-center border-x border-white/10 px-8">
            <p className="font-bold text-lg">0</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-lg">0</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Likes</p>
          </div>
        </div>

        <div className="flex gap-2 w-full px-4">
          <Button variant="outline" className="flex-1 border-white/10 hover:bg-white/5">
            Edit Profile
          </Button>
          <Button variant="outline" size="icon" className="border-white/10" onClick={logout}>
            <LogOut className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none p-0 h-12">
          <TabsTrigger value="videos" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <Grid className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <Heart className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <Bookmark className="w-5 h-5" />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="p-1 grid grid-cols-3 gap-1">
          <div className="aspect-[3/4] bg-muted/20 rounded-sm" />
          <div className="aspect-[3/4] bg-muted/20 rounded-sm" />
          <div className="aspect-[3/4] bg-muted/20 rounded-sm" />
        </TabsContent>
        <TabsContent value="liked" className="p-4 text-center text-muted-foreground text-sm">
          No liked videos yet
        </TabsContent>
        <TabsContent value="saved" className="p-4 text-center text-muted-foreground text-sm">
          No saved videos yet
        </TabsContent>
      </Tabs>
    </div>
  );
}
