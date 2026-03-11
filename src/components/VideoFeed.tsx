"use client";

import React, { useState } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Heart, MessageCircle, Forward, CircleUser } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const DUMMY_VIDEOS = [
  {
    id: "7aA18NqA6K0",
    creator: "@neon_vibe",
    caption: "Mumbai nights hitting different 🚀 #reloxo #future #vibes",
    likes: "12.4k",
    comments: "842",
    shares: "1.2k",
  },
  {
    id: "M5O8r_R4oYo",
    creator: "@tech_india",
    caption: "The future of AI is happening now in Bangalore! 🤖🇮🇳 #innovation #tech",
    likes: "45.1k",
    comments: "2.1k",
    shares: "5.6k",
  },
  {
    id: "Xf7_WvW0JtA",
    creator: "@dance_crew_official",
    caption: "New routine unlocked! Can you keep up? 🔥🕺 #dance #challenge",
    likes: "8.9k",
    comments: "450",
    shares: "890",
  },
];

export function VideoFeed() {
  const { user, openLoginModal } = useAuth();
  const [likedVideos, setLikedVideos] = useState<string[]>([]);

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
      mute: 1,
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
    // Other interactions would be handled here
  };

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar">
      {DUMMY_VIDEOS.map((video) => (
        <section
          key={video.id}
          className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden"
        >
          {/* YouTube Player */}
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <YouTube
              videoId={video.id}
              opts={opts}
              onReady={onPlayerReady}
              className="w-full h-full"
              containerClassName="w-full h-full scale-[1.5]"
            />
          </div>

          {/* TikTok UI Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />

          {/* Bottom Left: Creator & Caption */}
          <div className="absolute bottom-6 left-4 right-16 flex flex-col gap-2 z-10">
            <h3 className="font-headline font-bold text-white text-lg neon-text">
              {video.creator}
            </h3>
            <p className="text-white text-sm leading-snug drop-shadow-md">
              {video.caption}
            </p>
          </div>

          {/* Bottom Right: Interaction Sidebar */}
          <div className="absolute bottom-6 right-4 flex flex-col items-center gap-6 z-10">
            <div 
              onClick={() => handleInteraction(video.id, 'profile')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <CircleUser className="w-8 h-8 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white">Profile</span>
            </div>

            <div 
              onClick={() => handleInteraction(video.id, 'like')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Heart className={cn(
                  "w-8 h-8 transition-colors",
                  likedVideos.includes(video.id) ? "text-primary fill-primary neon-text" : "text-white group-hover:text-primary"
                )} />
              </div>
              <span className="text-[10px] font-bold text-white">{video.likes}</span>
            </div>

            <div 
              onClick={() => handleInteraction(video.id, 'comment')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white">{video.comments}</span>
            </div>

            <div 
              onClick={() => handleInteraction(video.id, 'share')}
              className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90"
            >
              <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Forward className="w-8 h-8 text-white" />
              </div>
              <span className="text-[10px] font-bold text-white">{video.shares}</span>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
