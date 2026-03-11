
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, Grid, Heart, Bookmark } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const { profile, logout } = useAuth();

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <h2 className="text-xl font-headline font-bold mb-4">Profile not found</h2>
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
            <AvatarImage src={profile.photoURL || ''} alt={profile.displayName || ''} />
            <AvatarFallback className="bg-muted text-xl">{profile.displayName?.charAt(0)}</AvatarFallback>
          </Avatar>
          {profile.isVerified && (
            <div className="absolute bottom-0 right-0 bg-primary text-black rounded-full p-1 border-2 border-black">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h1 className="text-xl font-headline font-bold neon-text">{profile.displayName}</h1>
          <p className="text-primary text-sm font-medium">{profile.username}</p>
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
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
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
          <div className="aspect-[3/4] bg-muted animate-pulse rounded-sm" />
          <div className="aspect-[3/4] bg-muted animate-pulse rounded-sm" />
          <div className="aspect-[3/4] bg-muted animate-pulse rounded-sm" />
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
