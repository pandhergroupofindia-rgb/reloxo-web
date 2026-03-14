'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Grid, Heart, Bookmark, LogOut, Settings, Play } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import Image from 'next/image';

const VIDEOS_COLLECTION_ID = 'videos';

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [fetchingVideos, setFetchingVideos] = useState(true);

  useEffect(() => {
    if (user?.$id || user?.uid) {
      fetchUserVideos();
    }
  }, [user]);

  const fetchUserVideos = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [
          Query.equal('uploaderUid', user?.$id || user?.uid),
          Query.orderDesc('$createdAt')
        ]
      );
      setUserVideos(response.documents);
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setFetchingVideos(false);
    }
  };

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
      {/* Profile Header */}
      <div className="p-6 flex flex-col items-center gap-6 border-b border-white/5 pt-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all" />
          <Avatar className="w-28 h-28 border-4 border-black ring-2 ring-primary relative z-10 shadow-[0_0_20px_rgba(51,240,255,0.3)]">
            <AvatarImage src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=33F0FF&color=000`} alt={user.name} />
            <AvatarFallback className="bg-zinc-900 text-2xl font-bold">{user.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-headline font-bold neon-text">{user.name || user.displayName}</h1>
          <p className="text-primary text-sm font-bold tracking-widest">{user.username || '@viber'}</p>
          <p className="text-muted-foreground text-xs max-w-[250px] mt-2 line-clamp-2 italic">
            {user.bio || 'Setting the stage for the next big vibe. ⚡'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-10 py-4 w-full justify-center">
          <div className="text-center group cursor-pointer">
            <p className="font-bold text-xl group-hover:text-primary transition-colors">0</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Following</p>
          </div>
          <div className="text-center border-x border-white/10 px-10 group cursor-pointer">
            <p className="font-bold text-xl group-hover:text-primary transition-colors">0</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Followers</p>
          </div>
          <div className="text-center group cursor-pointer">
            <p className="font-bold text-xl group-hover:text-primary transition-colors">
              {userVideos.reduce((acc, v) => acc + (v.likesCount || 0), 0)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Likes</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full px-4">
          <Button variant="outline" className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">
            Edit Vibe
          </Button>
          <Button variant="outline" size="icon" className="border-white/10 bg-white/5 hover:bg-white/10 rounded-xl w-12 h-12" onClick={logout}>
            <LogOut className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Profile Content */}
      <Tabs defaultValue="videos" className="w-full flex-1 flex flex-col">
        <TabsList className="w-full bg-black border-b border-white/5 rounded-none p-0 h-14">
          <TabsTrigger value="videos" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Grid className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Heart className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Bookmark className="w-5 h-5" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="flex-1 bg-black p-0.5 m-0">
          {fetchingVideos ? (
            <div className="p-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : userVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5">
              {userVideos.map((video) => (
                <div key={video.$id} className="relative aspect-[3/4] bg-zinc-900 overflow-hidden group">
                  <Image 
                    src={`https://img.youtube.com/vi/${video.youtubeId}/0.jpg`}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 text-white fill-white" />
                    <span className="text-[10px] font-bold text-white drop-shadow-md">
                      {video.likesCount || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-4 flex flex-col items-center">
              <div className="p-4 rounded-full bg-white/5 border border-white/10">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">No Vibes Posted</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="liked" className="p-12 text-center flex flex-col items-center gap-4">
          <Heart className="w-10 h-10 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">No Liked Vibes Yet</p>
        </TabsContent>
        
        <TabsContent value="saved" className="p-12 text-center flex flex-col items-center gap-4">
          <Bookmark className="w-10 h-10 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">No Saved Vibes Yet</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
