"use client";

import React, { useState, useEffect, useRef } from "react";
import YouTube, { YouTubeProps } from "react-youtube";
import { Heart, MessageCircle, Forward, PlusCircle, Check, Search, MoreVertical, Trash2, Music2, AlertTriangle, Play, Pause } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { databases, DATABASE_ID, Query, COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";
import { CommentsModal } from "./CommentsModal";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const VIDEOS_COLLECTION_ID = 'videos';
const LIKES_COLLECTION_ID = 'likes';
const FOLLOWERS_COLLECTION_ID = 'followers';

export function VideoFeed() {
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [feed, setFeed] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<string | null>(null);
  
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [showInteractionIcon, setShowInteractionIcon] = useState<'play' | 'pause' | 'like' | null>(null);
  const playerRefs = useRef<Record<string, any>>({});
  const lastTap = useRef<number>(0);

  useEffect(() => {
    setIsMounted(true);
    fetchVideos();
  }, []);

  useEffect(() => {
    if (user && feed.length > 0) {
      fetchUserLikes();
      fetchUserFollows();
    }
  }, [user, feed]);

  const fetchVideos = async () => {
    setError(null);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.limit(30)]
      );
      
      const processedFeed: any[] = [];
      response.documents.forEach((video, index) => {
        processedFeed.push(video);
        if ((index + 1) % 5 === 0) {
          processedFeed.push({ isAd: true, $id: `ad-${index}` });
        }
      });
      
      setFeed(processedFeed);
      
      const uploaderIds = Array.from(new Set(response.documents.map((v: any) => v.uploaderUid)));
      uploaderIds.forEach(id => fetchUserProfile(id));
      
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError(err.message || 'Failed to sync vibes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (uid: string) => {
    if (userProfiles[uid]) return;
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, uid);
      const profile = JSON.parse(doc.profileData || '{}');
      setUserProfiles(prev => ({ ...prev, [uid]: profile }));
    } catch (e) { }
  };

  const fetchUserLikes = async () => {
    try {
      const userId = user.$id || user.uid;
      const response = await databases.listDocuments(
        DATABASE_ID,
        LIKES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      setLikedVideos(response.documents.map((doc: any) => doc.videoId));
    } catch (error) { }
  };

  const fetchUserFollows = async () => {
    try {
      const userId = user.$id || user.uid;
      const response = await databases.listDocuments(
        DATABASE_ID,
        FOLLOWERS_COLLECTION_ID,
        [Query.equal('followerId', userId)]
      );
      setFollowedUsers(response.documents.map((doc: any) => doc.followingId));
    } catch (error) { }
  };

  const handleInteraction = async (videoId: string, video: any) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double Tap (Like)
      if (!likedVideos.includes(video.$id)) {
        handleLike(video.$id, video.likesCount || 0);
      }
      setShowInteractionIcon('like');
      setTimeout(() => setShowInteractionIcon(null), 800);
    } else {
      // Single Tap (Play/Pause)
      const player = playerRefs.current[videoId];
      if (player) {
        const state = await player.getPlayerState();
        if (state === 1) { // playing
          player.pauseVideo();
          setShowInteractionIcon('pause');
        } else {
          player.playVideo();
          setShowInteractionIcon('play');
        }
        setTimeout(() => setShowInteractionIcon(null), 800);
      }
    }
    lastTap.current = now;
  };

  const onPlayerReady = (event: any, id: string) => {
    playerRefs.current[id] = event.target;
  };

  const handleLike = async (videoId: string, currentLikes: number) => {
    if (!user) {
      openLoginModal();
      return;
    }

    const userId = user.$id || user.uid;
    const isLiked = likedVideos.includes(videoId);

    try {
      if (isLiked) {
        const existingLikes = await databases.listDocuments(
          DATABASE_ID,
          LIKES_COLLECTION_ID,
          [Query.equal('userId', userId), Query.equal('videoId', videoId)]
        );
        
        if (existingLikes.total > 0) {
          await databases.deleteDocument(DATABASE_ID, LIKES_COLLECTION_ID, existingLikes.documents[0].$id);
        }

        const newLikesCount = Math.max(0, currentLikes - 1);
        await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, {
          likesCount: newLikesCount
        });

        setLikedVideos(prev => prev.filter(id => id !== videoId));
        setFeed(prev => prev.map(v => v.$id === videoId ? { ...v, likesCount: newLikesCount } : v));
      } else {
        await databases.createDocument(DATABASE_ID, LIKES_COLLECTION_ID, ID.unique(), {
          userId: userId,
          videoId: videoId
        });

        const newLikesCount = currentLikes + 1;
        await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, {
          likesCount: newLikesCount
        });

        setLikedVideos(prev => [...prev, videoId]);
        setFeed(prev => prev.map(v => v.$id === videoId ? { ...v, likesCount: newLikesCount } : v));
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleFollow = async (uploaderId: string) => {
    if (!user) {
      openLoginModal();
      return;
    }
    
    if (user.$id === uploaderId || followedUsers.includes(uploaderId)) return;

    try {
      await databases.createDocument(DATABASE_ID, FOLLOWERS_COLLECTION_ID, ID.unique(), {
        followerId: user.$id || user.uid,
        followingId: uploaderId
      });
      
      setFollowedUsers(prev => [...prev, uploaderId]);
      toast({
        title: "Followed! ⚡",
        description: "You're now following this creator.",
      });
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/?v=${video.youtubeId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title || 'Relox Vibe',
          text: video.caption || 'Check out this vibe on Relox!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied! 🚀",
          description: "Share the vibe with your friends.",
        });
      }
      
      const newSharesCount = (video.sharesCount || 0) + 1;
      await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, video.$id, {
        sharesCount: newSharesCount
      });
      
      setFeed(prev => prev.map(v => v.$id === video.$id ? { ...v, sharesCount: newSharesCount } : v));
    } catch (error) { }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this vibe?')) return;
    try {
      await databases.deleteDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId);
      setFeed(prev => prev.filter(v => v.$id !== videoId));
      toast({ title: "Vibe Deleted" });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed' });
    }
  };

  if (!isMounted) return <div className="h-full w-full bg-black" />;

  if (loading) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-primary font-medium tracking-[0.2em] text-xs uppercase animate-pulse">Syncing Vibes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center p-8 text-center gap-6">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-headline font-bold text-white">Sync Failed</h2>
        <button onClick={fetchVideos} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase">Retry</button>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative">
      <div className="fixed top-0 left-0 w-full z-[100] p-6 flex items-center justify-between pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
        <div className="pointer-events-auto">
          <h1 className="text-2xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            Relox
          </h1>
        </div>
        <div className="pointer-events-auto p-2 bg-black/20 backdrop-blur-md rounded-full border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
          <Search className="w-5 h-5 text-white" />
        </div>
      </div>

      {feed.map((item) => {
        if (item.isAd) {
          return (
            <section key={item.$id} className="h-full w-full snap-start relative bg-zinc-900 flex items-center justify-center p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <AlertTriangle className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-white/40 font-bold uppercase tracking-widest text-xs">Advertisement Placeholder</h3>
                <p className="text-white/20 text-[10px] max-w-[200px]">Monetization services (Monetag/AdSense) will be integrated here.</p>
              </div>
            </section>
          );
        }

        const profile = userProfiles[item.uploaderUid];
        const isOwner = user && item.uploaderUid === (user.$id || user.uid);

        return (
          <section key={item.$id} className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <YouTube
                videoId={item.youtubeId}
                opts={{
                  height: "100%",
                  width: "100%",
                  playerVars: { autoplay: 1, controls: 0, modestbranding: 1, loop: 1, rel: 0, playsinline: 1, mute: 0 },
                }}
                onReady={(e) => onPlayerReady(e, item.$id)}
                className="w-full h-full"
                containerClassName="w-full h-full scale-[1.5]"
              />
            </div>

            <div 
              className="absolute inset-0 z-10 cursor-pointer"
              onClick={() => handleInteraction(item.$id, item)}
            />

            {showInteractionIcon && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-in zoom-in fade-in duration-300">
                {showInteractionIcon === 'play' && <Play className="w-20 h-20 text-white/50 fill-white/20" />}
                {showInteractionIcon === 'pause' && <Pause className="w-20 h-20 text-white/50 fill-white/20" />}
                {showInteractionIcon === 'like' && <Heart className="w-24 h-24 text-primary fill-primary drop-shadow-[0_0_20px_rgba(51,240,255,0.6)]" />}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 pointer-events-none z-10" />

            <div className="absolute bottom-24 left-4 right-20 flex flex-col gap-3 z-30 animate-in slide-in-from-left-4 duration-500 pointer-events-none">
              <div className="flex flex-col gap-1">
                <span className="text-primary font-bold text-sm tracking-widest drop-shadow-md">
                  {profile?.username || `@creator_${item.uploaderUid.slice(-4)}`}
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-white text-lg neon-text">
                    {item.title || 'Untitled Vibe'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                    {item.category || 'General'}
                  </span>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-snug line-clamp-2 drop-shadow-md">
                {item.caption}
              </p>
            </div>

            <div className="absolute bottom-24 right-4 flex flex-col items-center gap-6 z-30">
              <div className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90 relative">
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5 shadow-lg">
                  <div className="bg-black rounded-full overflow-hidden w-10 h-10 border border-black">
                    <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${item.uploaderUid}&background=33F0FF&color=000`} className="w-full h-full object-cover" alt="Avatar" />
                  </div>
                </div>
                {!followedUsers.includes(item.uploaderUid) && !isOwner && (
                  <button onClick={() => handleFollow(item.uploaderUid)} className="absolute -bottom-2 bg-primary rounded-full p-0.5 border-2 border-black hover:scale-110 transition-transform">
                    <PlusCircle className="w-4 h-4 text-black" />
                  </button>
                )}
              </div>

              <div onClick={() => handleLike(item.$id, item.likesCount || 0)} className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                  <Heart className={cn("w-7 h-7 transition-all duration-300", likedVideos.includes(item.$id) ? "text-primary fill-primary scale-110 drop-shadow-[0_0_8px_rgba(51,240,255,0.6)]" : "text-white")} />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">{item.likesCount || 0}</span>
              </div>

              <div onClick={() => setSelectedVideoForComments(item.$id)} className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">{item.commentsCount || 0}</span>
              </div>

              <div onClick={() => handleShare(item)} className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto transition-transform active:scale-90">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
                  <Forward className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white drop-shadow-md">{item.sharesCount || 0}</span>
              </div>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <MoreVertical className="w-5 h-5 text-white/50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white">
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 gap-2 cursor-pointer" onClick={() => handleDelete(item.$id)}>
                      <Trash2 className="w-4 h-4" />
                      Delete Vibe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </section>
        );
      })}

      <CommentsModal isOpen={!!selectedVideoForComments} onClose={() => setSelectedVideoForComments(null)} videoId={selectedVideoForComments || ''} />
    </div>
  );
}