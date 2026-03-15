'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Heart, MessageCircle, Forward, PlusCircle, Search, MoreVertical, Trash2, AlertTriangle, Play, Pause } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { CommentsModal } from './CommentsModal';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const VIDEOS_COLLECTION_ID = 'videos';
const LIKES_COLLECTION_ID = 'likes';
const FOLLOWERS_COLLECTION_ID = 'followers';
const REPORTS_COLLECTION_ID = 'reports';

export function VideoFeed() {
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [feed, setFeed] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showInteractionIcon, setShowInteractionIcon] = useState<'play' | 'pause' | 'like' | null>(null);
  
  // Bulletproof Optimistic Likes State
  const [localLikes, setLocalLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({});
  
  const playerRefs = useRef<Record<string, any>>({});
  const lastTap = useRef<number>(0);

  useEffect(() => {
    setIsMounted(true);
    fetchVideos();
  }, []);

  useEffect(() => {
    if (user && isMounted) {
      fetchUserFollows();
      syncUserLikes();
    }
  }, [user, isMounted, feed.length]);

  const fetchVideos = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.limit(30)]
      );
      
      const processedFeed: any[] = [];
      const initialLocalLikes: Record<string, { isLiked: boolean; count: number }> = {};

      response.documents.forEach((video, index) => {
        processedFeed.push(video);
        initialLocalLikes[video.$id] = { isLiked: false, count: video.likesCount || 0 };
        if ((index + 1) % 5 === 0) {
          processedFeed.push({ isAd: true, $id: `ad-${index}` });
        }
      });
      
      setFeed(processedFeed);
      setLocalLikes(initialLocalLikes);
      
      const uploaderIds = Array.from(new Set(response.documents.map((v: any) => v.uploaderUid)));
      uploaderIds.forEach(id => fetchUserProfile(id));
      
    } catch (err: any) {
      setError('Failed to sync vibes.');
    } finally {
      setLoading(false);
    }
  };

  const syncUserLikes = async () => {
    if (!user) return;
    try {
      const userId = user.$id || user.uid;
      const response = await databases.listDocuments(
        DATABASE_ID,
        LIKES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      
      const likedVideoIds = response.documents.map((doc: any) => doc.videoId);
      setLocalLikes(prev => {
        const next = { ...prev };
        likedVideoIds.forEach(id => {
          if (next[id]) next[id].isLiked = true;
        });
        return next;
      });
    } catch (error) {}
  };

  const fetchUserProfile = async (uid: string) => {
    if (userProfiles[uid]) return;
    try {
      const doc = await databases.getDocument(DATABASE_ID, 'users', uid);
      const profile = JSON.parse(doc.profileData || '{}');
      setUserProfiles(prev => ({ ...prev, [uid]: profile }));
    } catch (e) {}
  };

  const fetchUserFollows = async () => {
    if (!user) return;
    try {
      const userId = user.$id || user.uid;
      const response = await databases.listDocuments(
        DATABASE_ID,
        FOLLOWERS_COLLECTION_ID,
        [Query.equal('followerId', userId)]
      );
      setFollowedUsers(response.documents.map((doc: any) => doc.followingId));
    } catch (error) {}
  };

  const handleLike = async (videoId: string) => {
    if (!user) {
      openLoginModal();
      return;
    }

    const userId = user.$id || user.uid;
    const currentState = localLikes[videoId] || { isLiked: false, count: 0 };
    const isLiked = currentState.isLiked;
    
    // Aggressive Optimistic UI Update
    setLocalLikes(prev => ({
      ...prev,
      [videoId]: {
        isLiked: !isLiked,
        count: isLiked ? Math.max(0, currentState.count - 1) : currentState.count + 1
      }
    }));

    try {
      if (isLiked) {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          LIKES_COLLECTION_ID,
          [Query.equal('userId', userId), Query.equal('videoId', videoId)]
        );
        if (existing.total > 0) {
          await databases.deleteDocument(DATABASE_ID, LIKES_COLLECTION_ID, existing.documents[0].$id);
        }
      } else {
        await databases.createDocument(DATABASE_ID, LIKES_COLLECTION_ID, ID.unique(), {
          userId,
          videoId
        });
      }

      await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, {
        likesCount: isLiked ? Math.max(0, currentState.count - 1) : currentState.count + 1
      });
    } catch (error) {
      // Silent Revert on failure
      setLocalLikes(prev => ({ ...prev, [videoId]: currentState }));
    }
  };

  const handleInteraction = (videoId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double Tap Logic
      const currentState = localLikes[videoId];
      if (currentState && !currentState.isLiked) {
        handleLike(videoId);
      }
      setShowInteractionIcon('like');
      setTimeout(() => setShowInteractionIcon(null), 800);
    } else {
      // Single Tap Pause/Play
      const player = playerRefs.current[videoId];
      if (player) {
        const state = player.getPlayerState();
        if (state === 1) {
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
      toast({ title: "Followed! ⚡" });
    } catch (error) {}
  };

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/?v=${video.youtubeId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: video.title || 'Relox Vibe', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied! 🚀" });
      }
      await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, video.$id, {
        sharesCount: (video.sharesCount || 0) + 1
      });
    } catch (error) {}
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm('Delete this vibe?')) return;
    try {
      await databases.deleteDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId);
      setFeed(prev => prev.filter(v => v.$id !== videoId));
      toast({ title: "Vibe Deleted" });
    } catch (error) {}
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const videoId = entry.target.getAttribute('data-video-id');
          if (entry.isIntersecting) {
            setActiveVideoId(videoId);
            if (videoId && playerRefs.current[videoId]) playerRefs.current[videoId].playVideo();
          } else {
            if (videoId && playerRefs.current[videoId]) playerRefs.current[videoId].pauseVideo();
          }
        });
      },
      { threshold: 0.8 }
    );
    document.querySelectorAll('section[data-video-id]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [feed]);

  if (!isMounted) return null;

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative bg-black">
      <header className="fixed top-0 left-0 w-full z-[100] p-4 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/5">
        <h1 className="text-2xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          Relox
        </h1>
        <Link href="/discover" className="p-2 bg-white/5 rounded-full border border-white/10">
          <Search className="w-5 h-5 text-white" />
        </Link>
      </header>

      {feed.map((item) => {
        if (item.isAd) {
          return (
            <section key={item.$id} className="h-full w-full snap-start relative bg-zinc-900 flex items-center justify-center p-12 text-center">
              <div className="space-y-4 opacity-30">
                <AlertTriangle className="w-12 h-12 mx-auto text-white" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Ad Placement</h3>
              </div>
            </section>
          );
        }

        const profile = userProfiles[item.uploaderUid];
        const state = localLikes[item.$id] || { isLiked: false, count: item.likesCount || 0 };
        const isOwner = user && item.uploaderUid === (user.$id || user.uid);
        const isFollowed = followedUsers.includes(item.uploaderUid);

        return (
          <section key={item.$id} data-video-id={item.$id} className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full pointer-events-none scale-[1.5]">
              <YouTube
                videoId={item.youtubeId}
                opts={{ height: "100%", width: "100%", playerVars: { autoplay: 0, controls: 0, modestbranding: 1, loop: 1, rel: 0, playsinline: 1 } }}
                onReady={(e) => { playerRefs.current[item.$id] = e.target; if (item.$id === activeVideoId) e.target.playVideo(); }}
                className="w-full h-full"
              />
            </div>

            <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => handleInteraction(item.$id)} />

            {showInteractionIcon && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-in zoom-in fade-in duration-300">
                {showInteractionIcon === 'play' && <Play className="w-20 h-20 text-white/50 fill-white/20" />}
                {showInteractionIcon === 'pause' && <Pause className="w-20 h-20 text-white/50 fill-white/20" />}
                {showInteractionIcon === 'like' && <Heart className="w-24 h-24 text-primary fill-primary drop-shadow-[0_0_20px_rgba(51,240,255,0.6)]" />}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none z-10" />

            <div className="absolute bottom-24 left-4 right-20 flex flex-col gap-3 z-30 pointer-events-none">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <Link href={`/profile?id=${item.uploaderUid}`} className="text-primary font-bold text-sm tracking-widest hover:underline">
                    {profile?.username || `@user_${item.uploaderUid.slice(-4)}`}
                  </Link>
                  {!isOwner && !isFollowed && (
                    <button onClick={() => handleFollow(item.uploaderUid)} className="bg-primary text-black text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-lg">
                      Follow
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-white text-lg neon-text">{item.title || 'Untitled'}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold border border-primary/30 uppercase">
                    {item.category || 'Vibe'}
                  </span>
                </div>
              </div>
              <p className="text-white/90 text-sm line-clamp-2">{item.caption}</p>
            </div>

            <div className="absolute bottom-24 right-4 flex flex-col items-center gap-6 z-30 pointer-events-auto">
              <Link href={`/profile?id=${item.uploaderUid}`} className="relative group">
                <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden shadow-lg">
                  <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${item.uploaderUid}&background=33F0FF&color=000`} className="w-full h-full object-cover" alt="Avatar" />
                </div>
                {!isFollowed && !isOwner && (
                  <button onClick={() => handleFollow(item.uploaderUid)} className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 border-2 border-black">
                    <PlusCircle className="w-4 h-4 text-black" />
                  </button>
                )}
              </Link>

              <button onClick={() => handleLike(item.$id)} className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <Heart className={cn("w-7 h-7 transition-all", state.isLiked ? "text-primary fill-primary drop-shadow-[0_0_8px_rgba(51,240,255,0.6)]" : "text-white")} />
                </div>
                <span className="text-[10px] font-bold text-white">{state.count}</span>
              </button>

              <button onClick={() => setSelectedVideoForComments(item.$id)} className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white">{item.commentsCount || 0}</span>
              </button>

              <button onClick={() => handleShare(item)} className="flex flex-col items-center gap-1">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                  <Forward className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white">{item.sharesCount || 0}</span>
              </button>

              <button onClick={() => { if (!user) openLoginModal(); else toast({ title: "Vibe Reported" }); }} className="flex flex-col items-center gap-1 opacity-50">
                <div className="p-3 rounded-full bg-white/10 border border-white/20">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
              </button>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-3 rounded-full bg-white/5 border border-white/10">
                      <MoreVertical className="w-5 h-5 text-white/50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-900 border-white/10 text-white">
                    <DropdownMenuItem className="text-destructive gap-2 cursor-pointer" onClick={() => handleDelete(item.$id)}>
                      <Trash2 className="w-4 h-4" /> Delete Vibe
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
