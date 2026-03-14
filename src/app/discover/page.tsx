'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Music2, Camera, Gamepad2, Loader2, Play } from 'lucide-react';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const VIDEOS_COLLECTION_ID = 'videos';

const categories = [
  { icon: TrendingUp, name: 'Trending' },
  { icon: Music2, name: 'Music' },
  { icon: Camera, name: 'Photography' },
  { icon: Gamepad2, name: 'Gaming' },
];

export default function DiscoverPage() {
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [Query.orderDesc('likesCount'), Query.limit(12)]
      );
      setTrendingVideos(response.documents);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-4 gap-6 overflow-y-auto hide-scrollbar pb-24">
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          className="bg-white/5 border-white/10 pl-10 focus-visible:ring-primary h-12 rounded-xl" 
          placeholder="Search creators and vibes..." 
        />
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {categories.map((cat) => (
          <div 
            key={cat.name}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2.5 rounded-full whitespace-nowrap hover:border-primary/50 cursor-pointer transition-all active:scale-95 shadow-lg"
          >
            <cat.icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{cat.name}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-headline font-bold text-lg neon-text flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Trending Vibes
        </h2>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trendingVideos.map((video) => (
              <div 
                key={video.$id} 
                className="relative aspect-[9/16] bg-zinc-900 rounded-xl overflow-hidden group cursor-pointer shadow-xl"
                onClick={() => router.push(`/?v=${video.youtubeId}`)}
              >
                <Image 
                  src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.youtubeId}/0.jpg`}
                  alt={video.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-xs font-bold text-white line-clamp-2">{video.title}</p>
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 text-white fill-white" />
                  <span className="text-[10px] font-bold text-white">{video.likesCount || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-headline font-bold text-lg neon-text">Featured Tags</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
            <span className="font-bold text-primary">#MumbaiNights</span>
          </div>
          <div className="aspect-video rounded-xl bg-gradient-to-br from-secondary/20 to-blue-500/20 border border-white/10 flex items-center justify-center p-4 text-center cursor-pointer hover:border-secondary/50 transition-colors">
            <span className="font-bold text-secondary">#FutureIndie</span>
          </div>
        </div>
      </div>
    </div>
  );
}
