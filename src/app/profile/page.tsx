
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Grid, Heart, Bookmark, LogOut, Settings, Play, Shield, FileText, ChevronRight, MessageSquare, CheckCircle2, Loader2, Coins, LayoutDashboard, Share2, Camera, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ID } from 'appwrite';
import Link from 'next/link';

const VIDEOS_COLLECTION_ID = 'videos';
const FOLLOWERS_COLLECTION_ID = 'followers';
const LIKES_COLLECTION_ID = 'likes';
const SAVED_COLLECTION_ID = 'saved_videos';

function ProfileContent() {
  const { user, logout, loading: authLoading, openLoginModal } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewingOtherUserId = searchParams.get('id');

  const [targetUser, setTargetUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '', file: null as File | null });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [listModal, setListModal] = useState<{ isOpen: boolean; type: 'followers' | 'following'; users: any[] }>({
    isOpen: false,
    type: 'followers',
    users: []
  });
  const [listLoading, setListLoading] = useState(false);

  const isOwnProfile = !viewingOtherUserId || viewingOtherUserId === user?.$id;

  useEffect(() => {
    const initProfile = async () => {
      setProfileLoading(true);
      const targetId = viewingOtherUserId || user?.$id;
      
      if (!targetId) {
        if (!authLoading && !viewingOtherUserId) setProfileLoading(false);
        return;
      }

      try {
        // Fetch User Data
        const userDoc = await databases.getDocument(DATABASE_ID, 'users', targetId);
        const profile = JSON.parse(userDoc.profileData || '{}');
        setTargetUser({ ...userDoc, ...profile });

        // Fetch Stats
        const followers = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followingId', targetId)]);
        setFollowersCount(followers.total);
        const following = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followerId', targetId)]);
        setFollowingCount(following.total);

        if (user && viewingOtherUserId) {
          const followCheck = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
            Query.equal('followerId', user.$id),
            Query.equal('followingId', targetId)
          ]);
          setIsFollowing(followCheck.total > 0);
        }

        // Fetch Tab Content
        const vids = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [Query.equal('uploaderUid', targetId), Query.orderDesc('$createdAt')]);
        setUserVideos(vids.documents);

        if (isOwnProfile) {
          const likes = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION_ID, [Query.equal('userId', targetId)]);
          if (likes.total > 0) {
            const likedVids = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [Query.equal('$id', likes.documents.map(l => l.videoId))]);
            setLikedVideos(likedVids.documents);
          }
          const saved = await databases.listDocuments(DATABASE_ID, SAVED_COLLECTION_ID, [Query.equal('userId', targetId)]);
          if (saved.total > 0) {
            const savedVids = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [Query.equal('$id', saved.documents.map(s => s.videoId))]);
            setSavedVideos(savedVids.documents);
          }
        }
      } catch (error) {
        console.error("Profile Load Error:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    initProfile();
  }, [user, viewingOtherUserId, authLoading]);

  const handleFollowToggle = async () => {
    if (!user) return openLoginModal();
    if (followLoading || !targetUser) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
          Query.equal('followerId', user.$id),
          Query.equal('followingId', targetUser.$id)
        ]);
        if (res.total > 0) {
          await databases.deleteDocument(DATABASE_ID, FOLLOWERS_COLLECTION_ID, res.documents[0].$id);
          setIsFollowing(false);
          setFollowersCount(p => Math.max(0, p - 1));
        }
      } else {
        await databases.createDocument(DATABASE_ID, FOLLOWERS_COLLECTION_ID, ID.unique(), {
          followerId: user.$id,
          followingId: targetUser.$id
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

  const fetchUsersForList = async (type: 'followers' | 'following') => {
    setListModal({ isOpen: true, type, users: [] });
    setListLoading(true);
    const targetId = viewingOtherUserId || user?.$id;
    if (!targetId) return;

    try {
      const field = type === 'followers' ? 'followingId' : 'followerId';
      const otherField = type === 'followers' ? 'followerId' : 'followingId';
      const res = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal(field, targetId)]);
      
      const userDetails = [];
      for (const doc of res.documents) {
        try {
          const uDoc = await databases.getDocument(DATABASE_ID, 'users', doc[otherField]);
          const profile = JSON.parse(uDoc.profileData || '{}');
          userDetails.push({ ...uDoc, ...profile });
        } catch (err) {}
      }
      setListModal(prev => ({ ...prev, users: userDetails }));
    } catch (e) {
      console.error(e);
    } finally {
      setListLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      let finalPhotoURL = targetUser?.photoURL;
      if (editData.file) {
        const fd = new FormData();
        fd.append('file', editData.file);
        const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        finalPhotoURL = data.secure_url;
      }

      const currentDoc = await databases.getDocument(DATABASE_ID, 'users', user.$id);
      const profile = JSON.parse(currentDoc.profileData || '{}');
      const updated = { ...profile, displayName: editData.name || profile.displayName, bio: editData.bio || profile.bio, photoURL: finalPhotoURL };
      
      await databases.updateDocument(DATABASE_ID, 'users', user.$id, { profileData: JSON.stringify(updated) });
      toast({ title: 'Profile Updated 🎉' });
      setIsEditing(false);
      window.location.reload();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/profile?id=${targetUser?.$id}`;
    if (navigator.share) {
      navigator.share({ title: `${targetUser?.displayName}'s Vibe`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard 🚀' });
    }
  };

  if (profileLoading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Loading Stage...</p>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-6 p-8 text-center">
        <X className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">User Not Found</h2>
        <Button onClick={() => router.push('/')} variant="outline">Back to Feed</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar pb-24">
      {/* Header Profile Section */}
      <div className="p-6 flex flex-col items-center gap-6 pt-12">
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
          <p className="text-muted-foreground text-xs mt-2 italic max-w-[280px]">{targetUser.bio || 'Living for the next vibe. ⚡'}</p>
        </div>

        <div className="flex gap-10 py-4 w-full justify-center">
          <div className="text-center cursor-pointer" onClick={() => fetchUsersForList('following')}>
            <p className="font-bold text-xl">{followingCount}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Following</p>
          </div>
          <div className="text-center border-x border-white/10 px-10 cursor-pointer" onClick={() => fetchUsersForList('followers')}>
            <p className="font-bold text-xl">{followersCount}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl">{userVideos.reduce((acc, v) => acc + (v.likesCount || 0), 0)}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Likes</p>
          </div>
        </div>

        {isOwnProfile && (
          <Link href="/dashboard" className="w-full px-4 mb-2">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center justify-between hover:border-primary/50 transition-all shadow-xl">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                <span className="font-headline font-bold text-sm">Professional Dashboard</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        )}

        <div className="flex gap-3 w-full px-4">
          {isOwnProfile ? (
            <>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]" onClick={() => {
                    setEditData({ name: targetUser.displayName, bio: targetUser.bio, file: null });
                    setPreviewUrl(targetUser.photoURL);
                  }}>Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-[2.5rem]">
                  <header className="text-center p-4"><h2 className="text-xl font-bold neon-text">Update Profile</h2></header>
                  <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                       <div className="relative group cursor-pointer" onClick={() => document.getElementById('pf-upload')?.click()}>
                          <Avatar className="w-24 h-24 border-2 border-primary">
                            <AvatarImage src={previewUrl || targetUser.photoURL} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6" /></div>
                          <input id="pf-upload" type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setEditData(p => ({ ...p, file: f }));
                              setPreviewUrl(URL.createObjectURL(f));
                            }
                          }} />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-primary uppercase px-1">Display Name</label>
                      <Input value={editData.name} onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-primary uppercase px-1">Bio</label>
                      <Textarea value={editData.bio} onChange={(e) => setEditData(p => ({ ...p, bio: e.target.value }))} className="bg-white/5 border-white/10 rounded-xl resize-none h-24" />
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col gap-2">
                    <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full bg-primary text-black font-bold h-12 rounded-xl">
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-white/10 bg-white/5 rounded-xl w-12 h-12"><Settings className="w-4 h-4" /></Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] p-6 pb-12 outline-none">
                  <SheetHeader className="mb-6"><SheetTitle className="text-xl font-bold text-white neon-text text-left">Account Hub</SheetTitle></SheetHeader>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/manage-vibes')}><div className="flex items-center gap-3"><Play className="w-5 h-5 text-primary" /><span>Manage Vibes 🎬</span></div><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/monetization')}><div className="flex items-center gap-3"><Coins className="w-5 h-5 text-primary" /><span>Monetization Setup 💰</span></div><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/privacy')}><div className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary" /><span>Privacy Policy</span></div><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/terms')}><div className="flex items-center gap-3"><FileText className="w-5 h-5 text-primary" /><span>Terms of Service</span></div><ChevronRight className="w-4 h-4" /></Button>
                    <div className="h-px bg-white/5 my-2" />
                    <Button variant="ghost" className="w-full justify-between h-14 text-destructive hover:bg-destructive/10 rounded-2xl" onClick={logout}><div className="flex items-center gap-3"><LogOut className="w-5 h-5" /><span>Logout</span></div></Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Button onClick={handleFollowToggle} disabled={followLoading} className={`flex-1 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] ${isFollowing ? 'bg-zinc-800' : 'bg-primary text-black'}`}>
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2" onClick={() => router.push(`/chat/${targetUser.$id}`)}>
                <MessageSquare className="w-3 h-3" /> Message
              </Button>
              <Button variant="outline" size="icon" className="border-white/10 bg-white/5 rounded-xl w-12 h-12" onClick={shareProfile}><Share2 className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      </div>

      <div id="relox-profile-banner-ad" className="w-full h-[60px] bg-white/5 my-4 text-center text-[10px] text-white/20 uppercase tracking-[0.4em] flex items-center justify-center border-y border-white/5">Ad Banner Space</div>

      <Tabs defaultValue="videos" className="w-full flex-1">
        <TabsList className="w-full bg-black border-b border-white/5 rounded-none p-0 h-14">
          <TabsTrigger value="videos" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"><Grid className="w-5 h-5" /></TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"><Heart className="w-5 h-5" /></TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"><Bookmark className="w-5 h-5" /></TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="m-0 p-0.5">
          {userVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5">
              {userVideos.map((v) => (
                <div key={v.$id} className="relative aspect-[3/4] bg-zinc-900 group cursor-pointer" onClick={() => router.push(`/?v=${v.youtubeId}`)}>
                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Vibe" />
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                    <Play className="w-2.5 h-2.5 text-white fill-white" />
                    <span className="text-[10px] font-bold text-white">{v.viewsCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center opacity-30 flex flex-col items-center gap-4"><Play className="w-8 h-8" /><p className="text-[10px] font-bold uppercase tracking-widest">No Vibes Recorded</p></div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="m-0 p-0.5">
          {likedVideos.length > 0 ? (
             <div className="grid grid-cols-3 gap-0.5">
              {likedVideos.map((v) => (
                <div key={v.$id} className="relative aspect-[3/4] bg-zinc-900 group cursor-pointer" onClick={() => router.push(`/?v=${v.youtubeId}`)}>
                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} className="w-full h-full object-cover" alt="Liked" />
                </div>
              ))}
             </div>
          ) : (
            <div className="p-20 text-center opacity-20 flex flex-col items-center gap-4"><Heart className="w-8 h-8" /><p className="text-[10px] font-bold uppercase tracking-widest">No Liked Vibes</p></div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="m-0 p-0.5">
           {savedVideos.length > 0 ? (
             <div className="grid grid-cols-3 gap-0.5">
              {savedVideos.map((v) => (
                <div key={v.$id} className="relative aspect-[3/4] bg-zinc-900 group cursor-pointer" onClick={() => router.push(`/?v=${v.youtubeId}`)}>
                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} className="w-full h-full object-cover" alt="Saved" />
                </div>
              ))}
             </div>
          ) : (
            <div className="p-20 text-center opacity-20 flex flex-col items-center gap-4"><Bookmark className="w-8 h-8" /><p className="text-[10px] font-bold uppercase tracking-widest">No Saved Vibes</p></div>
          )}
        </TabsContent>
      </Tabs>

      {/* List Modal (Followers/Following) */}
      <Dialog open={listModal.isOpen} onOpenChange={(open) => setListModal(p => ({ ...p, isOpen: open }))}>
        <DialogContent className="bg-zinc-950 border-white/10 p-0 max-w-sm rounded-[2.5rem] h-[70vh] flex flex-col overflow-hidden">
          <header className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest neon-text">{listModal.type}</h2>
            <DialogClose className="p-2 hover:bg-white/5 rounded-full"><X className="w-4 h-4" /></DialogClose>
          </header>
          <ScrollArea className="flex-1 p-4">
            {listLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : listModal.users.length > 0 ? (
              <div className="space-y-4">
                {listModal.users.map((u) => (
                  <div key={u.$id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setListModal(p => ({ ...p, isOpen: false })); router.push(`/profile?id=${u.$id}`); }}>
                      <Avatar className="w-10 h-10"><AvatarImage src={u.photoURL} /><AvatarFallback>{u.displayName?.[0]}</AvatarFallback></Avatar>
                      <div><p className="text-xs font-bold">{u.displayName}</p><p className="text-[10px] text-muted-foreground">{u.username}</p></div>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 rounded-full text-[10px] font-bold uppercase" onClick={() => router.push(`/chat/${u.$id}`)}>Message</Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest">No Vibes Detected</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-full bg-black gap-4"><Loader2 className="w-10 h-10 text-primary animate-spin" /><p className="text-primary text-[10px] font-bold uppercase tracking-widest">Loading Stage...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}
