
'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Heart, MessageCircle, Forward, PlusCircle, Search, MoreVertical, Trash2, AlertTriangle, Play, Pause, FastForward, Bookmark, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { CommentsModal } from './CommentsModal';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const VIDEOS_COLLECTION_ID = 'videos';
const LIKES_COLLECTION_ID = 'likes';
const COMMENTS_COLLECTION_ID = 'comments';
const FOLLOWERS_COLLECTION_ID = 'followers';
const SAVED_COLLECTION_ID = 'saved_videos';
const VIEWS_COLLECTION_ID = 'views';

export function VideoFeed() {
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [feed, setFeed] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showInteractionIcon, setShowInteractionIcon] = useState<'play' | 'pause' | 'like' | null>(null);
  const [localLikes, setLocalLikes] = useState<Record<string, { isLiked: boolean; count: number }>>({});
  
  const [adState, setAdState] = useState<{ show: boolean; countdown: number; type: 'mid' | 'post' | null; canSkip: boolean; videoId: string | null }>({
    show: false, countdown: 7, type: null, canSkip: false, videoId: null
  });
  
  const playerRefs = useRef<Record<string, any>>({});
  const shownAds = useRef<Set<string>>(new Set());
  const adIntervalRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchVideos();
    return () => { if (adIntervalRef.current) clearInterval(adIntervalRef.current); };
  }, []);

  useEffect(() => {
    if (user && isMounted) {
      fetchUserFollows();
      syncUserLikes();
    }
  }, [user, isMounted, feed.length]);

  const fetchVideos = async () => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [Query.orderDesc('$createdAt'), Query.limit(40)]);
      const processed = [];
      const likesMap: any = {};
      response.documents.forEach((v, i) => {
        processed.push(v);
        likesMap[v.$id] = { isLiked: false, count: v.likesCount || 0 };
        if ((i + 1) % 4 === 0) processed.push({ isAd: true, $id: `feed-ad-${i}` });
      });
      setFeed(processed);
      setLocalLikes(likesMap);
      response.documents.forEach(v => fetchUserProfile(v.uploaderUid));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const syncUserLikes = async () => {
    if (!user) return;
    try {
      const res = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION_ID, [Query.equal('userId', user.$id)]);
      const likedIds = res.documents.map(d => d.videoId);
      setLocalLikes(prev => {
        const next = { ...prev };
        likedIds.forEach(id => { if (next[id]) next[id].isLiked = true; });
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

  const fetchUserFollows = async () => {
    if (!user) return;
    try {
      const res = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followerId', user.$id)]);
      setFollowedUsers(res.documents.map(d => d.followingId));
    } catch (e) {}
  };

  const registerView = async (videoId: string) => {
    if (!user) return;
    try {
      const existing = await databases.listDocuments(DATABASE_ID, VIEWS_COLLECTION_ID, [
        Query.equal('userId', user.$id),
        Query.equal('videoId', videoId)
      ]);
      if (existing.total === 0) {
        await databases.createDocument(DATABASE_ID, VIEWS_COLLECTION_ID, ID.unique(), { userId: user.$id, videoId });
        const vidDoc = await databases.getDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId);
        await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, { viewsCount: (vidDoc.viewsCount || 0) + 1 });
      }
    } catch (e) {}
  };

  const handleLike = async (videoId: string) => {
    if (!user) return openLoginModal();
    const state = localLikes[videoId] || { isLiked: false, count: 0 };
    setLocalLikes(p => ({ ...p, [videoId]: { isLiked: !state.isLiked, count: state.isLiked ? state.count - 1 : state.count + 1 } }));
    try {
      if (state.isLiked) {
        const res = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION_ID, [Query.equal('userId', user.$id), Query.equal('videoId', videoId)]);
        if (res.total > 0) await databases.deleteDocument(DATABASE_ID, LIKES_COLLECTION_ID, res.documents[0].$id);
      } else {
        await databases.createDocument(DATABASE_ID, LIKES_COLLECTION_ID, ID.unique(), { userId: user.$id, videoId });
      }
      await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, { likesCount: state.isLiked ? state.count - 1 : state.count + 1 });
    } catch (e) { setLocalLikes(p => ({ ...p, [videoId]: state })); }
  };

  const triggerAd = (videoId: string, type: 'mid' | 'post') => {
    const player = playerRefs.current[videoId];
    if (!player) return;
    player.pauseVideo();
    setAdState({ show: true, countdown: 7, type, canSkip: false, videoId });
    let c = 7;
    const t = setInterval(() => {
      c--;
      setAdState(p => ({ ...p, countdown: c }));
      if (c <= 0) { setAdState(p => ({ ...p, canSkip: true })); clearInterval(t); }
    }, 1000);
  };

  useEffect(() => {
    if (adIntervalRef.current) clearInterval(adIntervalRef.current);
    if (activeVideoId && playerRefs.current[activeVideoId]) {
      adIntervalRef.current = setInterval(() => {
        const p = playerRefs.current[activeVideoId];
        const time = Math.floor(p.getCurrentTime());
        if ([15, 90, 180].includes(time) && !shownAds.current.has(`${activeVideoId}-${time}`)) {
          shownAds.current.add(`${activeVideoId}-${time}`);
          triggerAd(activeVideoId, 'mid');
        }
      }, 500);
    }
    return () => clearInterval(adIntervalRef.current);
  }, [activeVideoId]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute('data-video-id');
        if (entry.isIntersecting) {
          setActiveVideoId(id);
          if (id && playerRefs.current[id]) {
            playerRefs.current[id].playVideo();
            registerView(id);
          }
        } else {
          if (id && playerRefs.current[id]) playerRefs.current[id].pauseVideo();
        }
      });
    }, { threshold: 0.8 });
    document.querySelectorAll('section[data-video-id]').forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [feed]);

  if (!isMounted) return null;

  return (
    <div className="h-full w-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar bg-black">
      <header className="fixed top-0 left-0 w-full z-[100] p-4 flex items-center justify-between bg-black/80 backdrop-blur-md border-b border-white/5">
        <h1 className="text-2xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Relox</h1>
        <Link href="/discover" className="p-2 bg-white/5 rounded-full"><Search className="w-5 h-5 text-white" /></Link>
      </header>

      {feed.map((item) => {
        if (item.isAd) {
          return (
            <section key={item.$id} className="h-full w-full snap-start relative bg-[#050505] flex items-center justify-center p-12 text-center">
               <div className="space-y-4 opacity-10">
                 <Sparkles className="w-20 h-20 mx-auto" />
                 <p className="uppercase tracking-[0.5em] text-[10px] font-bold">Premium Ad Slot</p>
               </div>
            </section>
          );
        }

        const profile = userProfiles[item.uploaderUid];
        const likes = localLikes[item.$id] || { isLiked: false, count: 0 };
        const isOwner = user?.$id === item.uploaderUid;

        return (
          <section key={item.$id} data-video-id={item.$id} className="h-full w-full snap-start relative bg-black flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 w-full h-full pointer-events-none scale-[1.5]">
              <YouTube
                videoId={item.youtubeId}
                opts={{ height: "100%", width: "100%", playerVars: { autoplay: 0, controls: 0, modestbranding: 1, loop: 0, rel: 0, playsinline: 1 } }}
                onReady={(e) => { playerRefs.current[item.$id] = e.target; if (item.$id === activeVideoId) e.target.playVideo(); }}
                onStateChange={(e) => {
                  if (e.data === 0) {
                    const key = `${item.$id}-end`;
                    if (!shownAds.current.has(key)) {
                      shownAds.current.add(key);
                      triggerAd(item.$id, 'post');
                    } else { e.target.seekTo(0); e.target.playVideo(); }
                  }
                }}
                className="w-full h-full"
              />
            </div>

            <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => {
              const p = playerRefs.current[item.$id];
              if (p) p.getPlayerState() === 1 ? p.pauseVideo() : p.playVideo();
            }} />

            {/* In-Stream Ad UI */}
            {adState.show && adState.videoId === item.$id && (
              <div className="absolute inset-0 z-50 bg-black/98 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
                <FastForward className="w-12 h-12 text-primary animate-pulse mb-6" />
                <h2 className="text-2xl font-headline font-bold neon-text mb-2">Sponsored Hook</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-10">Supporting creators via short ads</p>
                <div className="w-full max-w-[240px]">
                  {adState.canSkip ? (
                    <button onClick={() => { setAdState(p => ({ ...p, show: false })); playerRefs.current[item.$id]?.playVideo(); }} className="w-full h-14 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2">Skip Ad <FastForward className="w-4 h-4" /></button>
                  ) : (
                    <div className="h-14 flex items-center justify-center border border-white/10 rounded-2xl text-[10px] uppercase font-bold text-white/30">Ad playing in {adState.countdown}s</div>
                  )}
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none z-10" />

            <div className="absolute bottom-24 left-4 right-20 flex flex-col gap-3 z-30 pointer-events-none">
              <div className="flex flex-col gap-1">
                <Link href={`/profile?id=${item.uploaderUid}`} className="text-primary font-bold text-sm pointer-events-auto hover:underline">{profile?.username || '@viber'}</Link>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-white text-lg neon-text">{item.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[8px] font-bold uppercase">{item.category}</span>
                </div>
              </div>
              <p className="text-white/80 text-sm line-clamp-2">{item.caption}</p>
              <p className="text-white/30 text-[10px] font-bold">👁 {item.viewsCount || 0} VIEWS</p>
            </div>

            <div className="absolute bottom-24 right-4 flex flex-col items-center gap-6 z-30 pointer-events-auto">
               <Link href={`/profile?id=${item.uploaderUid}`} className="relative">
                 <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden">
                   <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${item.uploaderUid}&background=33F0FF&color=000`} className="w-full h-full object-cover" />
                 </div>
               </Link>
               <button onClick={() => handleLike(item.$id)} className="flex flex-col items-center gap-1">
                 <div className="p-3 rounded-full bg-white/10 backdrop-blur-md"><Heart className={cn("w-7 h-7", likes.isLiked ? "text-primary fill-primary" : "text-white")} /></div>
                 <span className="text-[10px] font-bold">{likes.count}</span>
               </button>
               <button onClick={() => setSelectedVideoForComments(item.$id)} className="flex flex-col items-center gap-1">
                 <div className="p-3 rounded-full bg-white/10 backdrop-blur-md"><MessageCircle className="w-7 h-7 text-white" /></div>
                 <span className="text-[10px] font-bold">{item.commentsCount || 0}</span>
               </button>
               <button onClick={() => { if(navigator.share) navigator.share({ url: window.location.origin + '/?v=' + item.youtubeId }); }} className="flex flex-col items-center gap-1">
                 <div className="p-3 rounded-full bg-white/10 backdrop-blur-md"><Forward className="w-7 h-7 text-white" /></div>
               </button>
               <DropdownMenu>
                 <DropdownMenuTrigger asChild><button className="p-3 rounded-full bg-white/5"><MoreVertical className="w-5 h-5 text-white/50" /></button></DropdownMenuTrigger>
                 <DropdownMenuContent className="bg-zinc-950 border-white/10 text-white">
                   <DropdownMenuItem className="gap-2" onClick={async () => {
                     if (!user) return openLoginModal();
                     try {
                        const check = await databases.listDocuments(DATABASE_ID, SAVED_COLLECTION_ID, [Query.equal('userId', user.$id), Query.equal('videoId', item.$id)]);
                        if (check.total > 0) return toast({ title: 'Already saved' });
                        await databases.createDocument(DATABASE_ID, SAVED_COLLECTION_ID, ID.unique(), { userId: user.$id, videoId: item.$id });
                        toast({ title: 'Vibe Saved 🔖' });
                     } catch (e) {}
                   }}><Bookmark className="w-4 h-4" /> Save Vibe</DropdownMenuItem>
                   {isOwner && (
                     <DropdownMenuItem className="text-destructive gap-2" onClick={async () => {
                       if(confirm('Delete permanently?')) {
                         await databases.deleteDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, item.$id);
                         setFeed(f => f.filter(x => x.$id !== item.$id));
                         toast({ title: 'Deleted' });
                       }
                     }}><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                   )}
                 </DropdownMenuContent>
               </DropdownMenu>
            </div>
          </section>
        );
      })}

      <CommentsModal isOpen={!!selectedVideoForComments} onClose={() => setSelectedVideoForComments(null)} videoId={selectedVideoForComments || ''} />
    </div>
  );
}
