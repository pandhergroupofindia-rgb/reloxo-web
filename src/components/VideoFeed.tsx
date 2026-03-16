'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { 
  Heart, 
  MessageCircle, 
  Forward, 
  PlusCircle, 
  Search, 
  MoreVertical, 
  Trash2, 
  AlertTriangle, 
  Play, 
  Pause, 
  FastForward, 
  Bookmark, 
  Sparkles,
  BarChart2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { CommentsModal } from './CommentsModal';
import { useToast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const VIDEOS_COLLECTION_ID = 'videos';
const LIKES_COLLECTION_ID = 'likes';
const VIEWS_COLLECTION_ID = 'views';
const SAVED_COLLECTION_ID = 'saved_videos';

export function VideoFeed() {
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [feed, setFeed] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<string | null>(null);
  
  // Interactions State
  const [localLikes, setLocalLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({});
  const [showInteractionIcon, setShowInteractionIcon] = useState<'play' | 'pause' | 'like' | null>(null);
  
  // Ad State
  const [adState, setAdState] = useState<{
    show: boolean;
    countdown: number;
    canSkip: boolean;
    videoId: string | null;
  }>({
    show: false,
    countdown: 7,
    canSkip: false,
    videoId: null
  });

  const playerRefs = useRef<Record<string, any>>({});
  const shownAds = useRef<Set<string>>(new Set());
  const adIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTap = useRef<number>(0);

  useEffect(() => {
    fetchVideos();
    return () => {
      if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (user && feed.length > 0) {
      syncUserLikes();
    }
  }, [user, feed.length]);

  const fetchVideos = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID, 
        VIDEOS_COLLECTION_ID, 
        [Query.orderDesc('$createdAt'), Query.limit(30)]
      );
      
      const processed = response.documents.map(v => ({ ...v, isAd: false }));
      setFeed(processed);
      
      // Initialize local likes map
      const likesMap: Record<string, any> = {};
      response.documents.forEach(v => {
        likesMap[v.$id] = { isLiked: false, count: v.likesCount || 0 };
        fetchUserProfile(v.uploaderUid);
      });
      setLocalLikes(likesMap);
    } catch (err) {
      console.error("Feed Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const syncUserLikes = async () => {
    if (!user) return;
    try {
      const res = await databases.listDocuments(
        DATABASE_ID, 
        LIKES_COLLECTION_ID, 
        [Query.equal('userId', user.$id)]
      );
      const likedIds = res.documents.map(d => d.videoId);
      setLocalLikes(prev => {
        const next = { ...prev };
        likedIds.forEach(id => {
          if (next[id]) next[id].isLiked = true;
        });
        return next;
      });
    } catch (e) {}
  };

  const fetchUserProfile = async (uid: string) => {
    if (userProfiles[uid]) return;
    try {
      const doc = await databases.getDocument(DATABASE_ID, 'users', uid);
      const profile = JSON.parse(doc.profileData || '{}');
      setUserProfiles(prev => ({ ...prev, [uid]: profile }));
    } catch (e) {}
  };

  // Real View Logic: Use IntersectionObserver to lock views
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const videoId = entry.target.getAttribute('data-video-id');
        if (entry.isIntersecting && videoId) {
          setActiveVideoId(videoId);
          if (playerRefs.current[videoId]) playerRefs.current[videoId].playVideo();
          registerView(videoId);
        } else if (videoId) {
          if (playerRefs.current[videoId]) playerRefs.current[videoId].pauseVideo();
        }
      });
    }, { threshold: 0.8 });

    document.querySelectorAll('section[data-video-id]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [feed]);

  const registerView = async (videoId: string) => {
    if (!user) return;
    try {
      const existing = await databases.listDocuments(DATABASE_ID, VIEWS_COLLECTION_ID, [
        Query.equal('userId', user.$id),
        Query.equal('videoId', videoId)
      ]);
      
      if (existing.total === 0) {
        await databases.createDocument(DATABASE_ID, VIEWS_COLLECTION_ID, ID.unique(), {
          userId: user.$id,
          videoId
        });
        const videoDoc = await databases.getDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId);
        await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, {
          viewsCount: (videoDoc.viewsCount || 0) + 1
        });
      }
    } catch (e) {}
  };

  // Interaction Logic
  const handleLike = async (videoId: string) => {
    if (!user) {
      openLoginModal();
      return;
    }

    const state = localLikes[videoId] || { isLiked: false, count: 0 };
    const isLiked = state.isLiked;

    // Optimistic UI
    setLocalLikes(prev => ({
      ...prev,
      [videoId]: { isLiked: !isLiked, count: isLiked ? Math.max(0, state.count - 1) : state.count + 1 }
    }));

    try {
      if (isLiked) {
        const res = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION_ID, [
          Query.equal('userId', user.$id),
          Query.equal('videoId', videoId)
        ]);
        if (res.total > 0) await databases.deleteDocument(DATABASE_ID, LIKES_COLLECTION_ID, res.documents[0].$id);
      } else {
        await databases.createDocument(DATABASE_ID, LIKES_COLLECTION_ID, ID.unique(), {
          userId: user.$id,
          videoId
        });
      }
      await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, {
        likesCount: isLiked ? Math.max(0, state.count - 1) : state.count + 1
      });
    } catch (e) {
      setLocalLikes(prev => ({ ...prev, [videoId]: state })); // Rollback
    }
  };

  const handleInteraction = (videoId: string) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // Double tap detected
      const state = localLikes[videoId];
      if (state && !state.isLiked) handleLike(videoId);
      setShowInteractionIcon('like');
      setTimeout(() => setShowInteractionIcon(null), 800);
    } else {
      // Single tap toggle
      const p = playerRefs.current[videoId];
      if (p) {
        const st = p.getPlayerState();
        if (st === 1) {
          p.pauseVideo();
          setShowInteractionIcon('pause');
        } else {
          p.playVideo();
          setShowInteractionIcon('play');
        }
        setTimeout(() => setShowInteractionIcon(null), 800);
      }
    }
    lastTap.current = now;
  };

  // Ad Engine
  const triggerAd = (videoId: string) => {
    const p = playerRefs.current[videoId];
    if (!p) return;
    p.pauseVideo();
    setAdState({ show: true, countdown: 7, canSkip: false, videoId });
    
    let c = 7;
    const interval = setInterval(() => {
      c--;
      setAdState(prev => ({ ...prev, countdown: c }));
      if (c <= 0) {
        setAdState(prev => ({ ...prev, canSkip: true }));
        clearInterval(interval);
      }
    }, 1000);
  };

  useEffect(() => {
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    if (activeVideoId && playerRefs.current[activeVideoId]) {
      adIntervalRef.current = setInterval(() => {
        const p = playerRefs.current[activeVideoId];
        if (!p || adState.show) return;
        const time = Math.floor(p.getCurrentTime());
        const breakpoints = [15, 90, 180];
        
        breakpoints.forEach(bp => {
          const key = `${activeVideoId}-${bp}`;
          if (time === bp && !shownAds.current.has(key)) {
            shownAds.current.add(key);
            triggerAd(activeVideoId);
          }
        });
      }, 500);
    }
    return () => { if (adIntervalRef.current) clearInterval(adIntervalRef.current); };
  }, [activeVideoId, adState.show]);

  const handleSkipAd = () => {
    const vidId = adState.videoId;
    setAdState(prev => ({ ...prev, show: false }));
    if (vidId && playerRefs.current[vidId]) playerRefs.current[vidId].playVideo();
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-primary text-xs font-bold uppercase tracking-widest animate-pulse">Syncing Vibes...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar bg-black relative">
      <header className="fixed top-0 left-0 w-full z-[100] p-4 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/5">
        <h1 className="text-2xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Relox</h1>
        <Link href="/discover" className="p-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
          <Search className="w-5 h-5 text-white" />
        </Link>
      </header>

      {feed.map((video) => {
        const profile = userProfiles[video.uploaderUid];
        const state = localLikes[video.$id] || { isLiked: false, count: 0 };
        const isOwner = user?.$id === video.uploaderUid;

        return (
          <section 
            key={video.$id} 
            data-video-id={video.$id} 
            className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden"
          >
            {/* Video Container */}
            <div className="absolute inset-0 w-full h-full pointer-events-none scale-[1.3] sm:scale-100">
              <YouTube
                videoId={video.youtubeId}
                opts={{ 
                  height: "100%", 
                  width: "100%", 
                  playerVars: { 
                    autoplay: 0, 
                    controls: 0, 
                    modestbranding: 1, 
                    loop: 0, 
                    rel: 0, 
                    playsinline: 1 
                  } 
                }}
                onReady={(e) => { playerRefs.current[video.$id] = e.target; }}
                onStateChange={(e) => {
                  if (e.data === 0) { // ENDED: Trigger post-roll ad
                    const key = `${video.$id}-end`;
                    if (!shownAds.current.has(key)) {
                      shownAds.current.add(key);
                      triggerAd(video.$id);
                    } else {
                      e.target.seekTo(0);
                      e.target.playVideo();
                    }
                  }
                }}
                className="w-full h-full"
              />
            </div>

            {/* Interaction Layer */}
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => handleInteraction(video.$id)} />

            {/* In-Stream Ad UI */}
            {adState.show && adState.videoId === video.$id && (
              <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                <FastForward className="w-16 h-16 text-primary animate-pulse mb-6" />
                <h2 className="text-2xl font-headline font-bold neon-text mb-2">Advertisement Playing...</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-10">Supporting creators via short ad hooks</p>
                <div className="w-full max-w-[240px]">
                  {adState.canSkip ? (
                    <button 
                      onClick={handleSkipAd} 
                      className="w-full h-14 bg-white text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95 shadow-xl"
                    >
                      Skip Ad <FastForward className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="h-14 flex items-center justify-center border border-white/10 rounded-2xl text-[10px] uppercase font-bold text-white/30 tracking-widest">
                      Ad playing in {adState.countdown}s
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Icon Feedback */}
            {showInteractionIcon && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-in zoom-in fade-in duration-300">
                {showInteractionIcon === 'play' && <Play className="w-20 h-20 text-white/40 fill-white/10" />}
                {showInteractionIcon === 'pause' && <Pause className="w-20 h-20 text-white/40 fill-white/10" />}
                {showInteractionIcon === 'like' && <Heart className="w-24 h-24 text-primary fill-primary drop-shadow-[0_0_20px_rgba(51,240,255,0.6)]" />}
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/95 pointer-events-none z-10" />

            {/* Sidebar Controls */}
            <div className="absolute bottom-24 right-4 flex flex-col items-center gap-6 z-30">
              <Link href={`/profile?id=${video.uploaderUid}`} className="relative group">
                <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden shadow-lg">
                  <img 
                    src={profile?.photoURL || `https://ui-avatars.com/api/?name=${video.uploaderUid}&background=33F0FF&color=000`} 
                    className="w-full h-full object-cover" 
                    alt="Avatar" 
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary rounded-full p-0.5 border-2 border-black">
                  <PlusCircle className="w-4 h-4 text-black" />
                </div>
              </Link>

              <button onClick={() => handleLike(video.$id)} className="flex flex-col items-center gap-1 group">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 group-active:scale-90 transition-transform">
                  <Heart className={cn("w-7 h-7 transition-all", state.isLiked ? "text-primary fill-primary drop-shadow-[0_0_10px_#33F0FF]" : "text-white")} />
                </div>
                <span className="text-[10px] font-bold text-white/90 drop-shadow-md">{state.count}</span>
              </button>

              <button onClick={() => setSelectedVideoForComments(video.$id)} className="flex flex-col items-center gap-1 group">
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 group-active:scale-90 transition-transform">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/90 drop-shadow-md">{video.commentsCount || 0}</span>
              </button>

              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: video.title, url: window.location.origin + '/?v=' + video.youtubeId });
                  }
                }} 
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 group-active:scale-90 transition-transform">
                  <Forward className="w-7 h-7 text-white" />
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-3 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <MoreVertical className="w-5 h-5 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-950 border-white/10 text-white min-w-[160px] rounded-2xl">
                  {isOwner ? (
                    <>
                      <DropdownMenuItem className="gap-2" onClick={() => (window as any).location.href = '/dashboard'}>
                        <BarChart2 className="w-4 h-4 text-primary" /> View Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive gap-2" 
                        onClick={async () => {
                          if (confirm('Delete Vibe permanently?')) {
                            await databases.deleteDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, video.$id);
                            setFeed(f => f.filter(v => v.$id !== video.$id));
                            toast({ title: 'Vibe deleted 🗑️' });
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Delete Vibe
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem className="gap-2" onClick={async () => {
                        if (!user) return openLoginModal();
                        const check = await databases.listDocuments(DATABASE_ID, SAVED_COLLECTION_ID, [
                          Query.equal('userId', user.$id),
                          Query.equal('videoId', video.$id)
                        ]);
                        if (check.total > 0) return toast({ title: 'Already saved' });
                        await databases.createDocument(DATABASE_ID, SAVED_COLLECTION_ID, ID.unique(), {
                          userId: user.$id,
                          videoId: video.$id
                        });
                        toast({ title: 'Vibe Saved 🔖' });
                      }}>
                        <Bookmark className="w-4 h-4 text-primary" /> Save Vibe
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive gap-2" onClick={() => toast({ title: 'Report submitted 🚩' })}>
                        <AlertTriangle className="w-4 h-4" /> Report
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={() => (window as any).location.reload()}>Refresh Feed</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Video Info Overlay */}
            <div className="absolute bottom-24 left-4 right-20 flex flex-col gap-3 z-30 pointer-events-none">
              <div className="flex flex-col gap-1">
                <Link href={`/profile?id=${video.uploaderUid}`} className="text-primary font-bold text-sm pointer-events-auto hover:underline tracking-widest uppercase">
                  {profile?.username || '@viber'}
                </Link>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-white text-lg neon-text line-clamp-1">{video.title || 'Untitled Vibe'}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold uppercase border border-primary/20">{video.category || 'Vibe'}</span>
                </div>
              </div>
              <p className="text-white/80 text-sm line-clamp-2 leading-relaxed">{video.caption}</p>
              <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase">
                <BarChart2 className="w-3 h-3" />
                <span>{video.viewsCount || 0} VIEWS</span>
              </div>
            </div>
          </section>
        );
      })}

      <CommentsModal 
        isOpen={!!selectedVideoForComments} 
        onClose={() => setSelectedVideoForComments(null)} 
        videoId={selectedVideoForComments || ''} 
      />
    </div>
  );
}
