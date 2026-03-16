
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  CheckCircle2, Loader2, MessageSquare, Share2, 
  ChevronLeft, Play, X, UserMinus, UserPlus 
} from 'lucide-react';
import { ID } from 'appwrite';
import { useToast } from '@/hooks/use-toast';

const VIDEOS_COLLECTION_ID = 'videos';
const FOLLOWERS_COLLECTION_ID = 'followers';

export default function OtherProfilePage() {
  const { id } = useParams();
  const profileId = id as string;
  const { user: currentUser, openLoginModal } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [targetUser, setTargetUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (profileId) {
      if (currentUser?.$id === profileId) {
        router.push('/profile');
        return;
      }
      fetchProfileData();
    }
  }, [profileId, currentUser]);

  const fetchProfileData = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      // 1. Fetch User
      const userDoc = await databases.getDocument(DATABASE_ID, 'users', profileId);
      const profile = JSON.parse(userDoc.profileData || '{}');
      setTargetUser({ ...userDoc, ...profile });

      // 2. Fetch Videos
      const vids = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [
        Query.equal('uploaderUid', profileId),
        Query.orderDesc('$createdAt')
      ]);
      setUserVideos(vids.documents);

      // 3. Stats
      const followers = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followingId', profileId)]);
      setFollowersCount(followers.total);
      
      const following = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followerId', profileId)]);
      setFollowingCount(following.total);

      // 4. Follow Status
      if (currentUser) {
        const followCheck = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
          Query.equal('followerId', currentUser.$id),
          Query.equal('followingId', profileId)
        ]);
        setIsFollowing(followCheck.total > 0);
      }
    } catch (error: any) {
      console.error("Profile Fetch Error:", error);
      if (error.code === 404) setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) return openLoginModal();
    if (followLoading || !targetUser) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
          Query.equal('followerId', currentUser.$id),
          Query.equal('followingId', profileId)
        ]);
        if (res.total > 0) {
          await databases.deleteDocument(DATABASE_ID, FOLLOWERS_COLLECTION_ID, res.documents[0].$id);
          setIsFollowing(false);
          setFollowersCount(p => Math.max(0, p - 1));
        }
      } else {
        await databases.createDocument(DATABASE_ID, FOLLOWERS_COLLECTION_ID, ID.unique(), {
          followerId: currentUser.$id,
          followingId: profileId
        });
        setIsFollowing(true);
        setFollowersCount(p => p + 1);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action failed' });
    } finally {
      setFollowLoading(false);
    }
  };

  const shareProfile = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `${targetUser?.displayName}'s Vibe`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard 🚀' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Tuning Vibe...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-6 p-8 text-center">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
          <X className="w-10 h-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">User Not Found</h2>
          <p className="text-muted-foreground text-sm">They might have vibed away to another dimension! 🌌</p>
        </div>
        <Button onClick={() => router.push('/')} variant="outline" className="border-primary text-primary">Back to Stage</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar pb-24">
      <header className="p-4 sticky top-0 bg-black/80 backdrop-blur-xl z-50 flex items-center gap-4 border-b border-white/5">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <span className="font-bold text-sm tracking-tight">{targetUser.displayName}</span>
      </header>

      <div className="p-6 flex flex-col items-center gap-6 pt-8">
        <div className="relative">
          <Avatar className="w-28 h-28 border-4 border-black ring-2 ring-primary">
            <AvatarImage src={targetUser.photoURL} />
            <AvatarFallback className="bg-zinc-900 text-2xl font-bold">{targetUser.displayName?.[0]}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-headline font-bold neon-text">{targetUser.displayName}</h1>
            {targetUser.isVerified && <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />}
          </div>
          <p className="text-primary text-sm font-bold tracking-widest">{targetUser.username}</p>
          <p className="text-muted-foreground text-xs mt-2 italic max-w-[280px]">{targetUser.bio || 'Vibe seeker. ⚡'}</p>
        </div>

        <div className="flex gap-10 py-4 w-full justify-center">
          <div className="text-center">
            <p className="font-bold text-xl">{followingCount}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Following</p>
          </div>
          <div className="text-center border-x border-white/10 px-10">
            <p className="font-bold text-xl">{followersCount}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl">{userVideos.reduce((acc, v) => acc + (v.likesCount || 0), 0)}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Likes</p>
          </div>
        </div>

        <div className="flex gap-3 w-full px-4">
          <Button 
            onClick={handleFollowToggle} 
            disabled={followLoading}
            className={`flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] ${
              isFollowing ? 'bg-zinc-800 text-white' : 'bg-primary text-black hover:bg-primary/90'
            }`}
          >
            {followLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFollowing ? (
              <span className="flex items-center gap-2"><UserMinus className="w-4 h-4" /> Following</span>
            ) : (
              <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Follow</span>
            )}
          </Button>

          <Button 
            variant="outline" 
            className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
            onClick={() => router.push(`/chat/${profileId}`)}
          >
            <MessageSquare className="w-4 h-4 mr-2" /> Message
          </Button>

          <Button 
            variant="outline" 
            size="icon" 
            className="border-white/10 bg-white/5 rounded-xl w-12 h-12"
            onClick={shareProfile}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="border-t border-white/5 mt-4">
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {userVideos.length > 0 ? (
            userVideos.map((v) => (
              <div key={v.$id} className="relative aspect-[3/4] bg-zinc-900 group cursor-pointer" onClick={() => router.push(`/?v=${v.youtubeId}`)}>
                <img src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/0.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Vibe" />
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                  <Play className="w-2.5 h-2.5 text-white fill-white" />
                  <span className="text-[10px] font-bold text-white">{v.viewsCount || 0}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 p-20 text-center opacity-30 flex flex-col items-center gap-4">
              <Play className="w-8 h-8" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Vibes Posted</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
