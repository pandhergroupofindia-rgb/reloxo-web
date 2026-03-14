"use client";

import React, { useState, useEffect } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Heart, MessageCircle, Forward, CircleUser, Music2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { databases, DATABASE_ID, Query } from "@/lib/appwrite";

const VIDEOS_COLLECTION_ID = 'videos';

export function VideoFeed() {
  const { user, openLoginModal } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.limit(10)]
      );
      setVideos(response.documents);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    event.target.playVideo();
  };

  const opts: YouTubeProps["opts"] = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      loop: 1,
      rel: 0,
      playsinline: 1,
      disablekb: 1,
      mute: 0,
    },
  };

  const handleInteraction = (videoId: string, type: 'like' | 'comment' | 'share' | 'profile') => {
    if (!user) {
      openLoginModal();
      return;
    }

    if (type === 'like') {
      setLikedVideos(prev => 
        prev.includes(videoId) 
          ? prev.filter(id => id !== videoId) 
          : [...prev, videoId]
      );
    }
  };

  if (!isMounted) return <div className="h-full w-full bg-black" />;

  if (loading) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary font-medium tracking-widest text-xs uppercase animate-pulse">Syncing Vibes...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="p-4 rounded-full bg-white/5 border border-white/10">
          <Music2 className="w-12 h-12 text-primary opacity-50" />
        </div>
        <h2 className="text-xl font-headline font-bold text-white neon-text">No Vibes Yet</h2>
        <p className="text-muted-foreground text-sm">Be the first to upload a masterpiece and set the stage!</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {videos.map((video) => (
        <section
          key={video.$id}
          className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <YouTube
              videoId={video.youtubeId}
              opts={opts}
              onReady={onPlayerReady}
              className="w-full h-full"
              containerClassName="w-full h-full scale-[1.5]"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none" />

          <div className="absolute bottom-24 left-4 right-20 flex flex-col gap-3 z-10 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-white text-lg neon-text">
                {video.title || 'Untitled Vibe'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                {video.category || 'General'}
              </span>
            </div>
            <p className="text-white/90 text-sm leading-snug line-clamp-2 drop-shadow-md">
              {video.caption}
            </p>
            <div className="flex items-center gap-2 text-primary">
              <Music2 className="w-3 h-3" />
              <span className="text-[10px] font-medium animate-marquee whitespace-nowrap overflow-hidden">
                Original Vibe • {video.title}
              </span>
            </div>
          </div>

          <div className="absolute bottom-24 right-4 flex flex-col items-center gap-6 z-10">
            <div 
              onClick={() => handleInteraction(video.$id, 'profile')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 relative">
                <CircleUser className="w-10 h-10 text-white" />
                <div className="absolute -bottom-1 -right-1 bg-primary text-black rounded-full p-0.5 border-2 border-black">
                  <Forward className="w-2 h-2 rotate-90" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleInteraction(video.$id, 'like')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                <Heart className={cn(
                  "w-7 h-7 transition-all duration-300",
                  likedVideos.includes(video.$id) ? "text-primary fill-primary scale-110 drop-shadow-[0_0_8px_rgba(51,240,255,0.6)]" : "text-white"
                )} />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                {likedVideos.includes(video.$id) ? (video.likesCount || 0) + 1 : (video.likesCount || 0)}
              </span>
            </div>

            <div 
              onClick={() => handleInteraction(video.$id, 'comment')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">0</span>
            </div>

            <div 
              onClick={() => handleInteraction(video.$id, 'share')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                <Forward className="w-7 h-7 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white drop-shadow-md">Share</span>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}