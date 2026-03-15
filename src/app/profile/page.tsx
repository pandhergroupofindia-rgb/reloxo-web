'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Grid, Heart, Bookmark, LogOut, Settings, Play, Shield, FileText, ChevronRight, MessageSquare, CheckCircle2, Loader2, Coins, LayoutDashboard, TrendingUp, X } from 'lucide-react';
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

function ProfileContent() {
  const { user, logout, loading, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [fetchingVideos, setFetchingVideos] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showListModal, setShowListModal] = useState<'followers' | 'following' | null>(null);
  const [userList, setUserList] = useState<any[]>([]);
  const [fetchingList, setFetchingList] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const viewingOtherUserId = searchParams.get('id');

  useEffect(() => {
    if (user && !viewingOtherUserId) {
      setTargetUser(user);
      setEditData({ 
        name: user?.displayName || user?.name || '', 
        bio: user?.bio || '' 
      });
    }
  }, [user, viewingOtherUserId]);

  useEffect(() => {
    const fetchTargetProfile = async () => {
      if (!viewingOtherUserId) return;
      try {
        const doc = await databases.getDocument(DATABASE_ID, 'users', viewingOtherUserId);
        const profile = JSON.parse(doc.profileData || '{}');
        setTargetUser({ ...doc, ...profile, $id: viewingOtherUserId });
      } catch (e) {
        console.error("Error fetching target profile:", e);
      }
    };
    fetchTargetProfile();
  }, [viewingOtherUserId]);

  useEffect(() => {
    const targetId = viewingOtherUserId || user?.$id;
    if (targetId) {
      fetchUserVideos(targetId);
      fetchFollowCounts(targetId);
      if (viewingOtherUserId && user) {
        checkFollowStatus(user.$id, viewingOtherUserId);
      }
    } else if (!loading && !viewingOtherUserId) {
      setFetchingVideos(false);
    }
  }, [user, viewingOtherUserId, loading]);

  const checkFollowStatus = async (followerId: string, followingId: string) => {
    try {
      const response = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
        Query.equal('followerId', followerId),
        Query.equal('followingId', followingId)
      ]);
      setIsFollowing(response.total > 0);
    } catch (error) {}
  };

  const fetchFollowCounts = async (targetId: string) => {
    try {
      const followers = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followingId', targetId)]);
      setFollowersCount(followers.total);
      const following = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followerId', targetId)]);
      setFollowingCount(following.total);
    } catch (error) {}
  };

  const handleFollowToggle = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    if (!viewingOtherUserId || followLoading) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        const response = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
          Query.equal('followerId', user.$id),
          Query.equal('followingId', viewingOtherUserId)
        ]);
        if (response.total > 0) {
          await databases.deleteDocument(DATABASE_ID, FOLLOWERS_COLLECTION_ID, response.documents[0].$id);
          setIsFollowing(false);
          setFollowersCount(prev => Math.max(0, prev - 1));
          toast({ title: "Unfollowed" });
        }
      } else {
        await databases.createDocument(DATABASE_ID, FOLLOWERS_COLLECTION_ID, ID.unique(), {
          followerId: user.$id,
          followingId: viewingOtherUserId
        });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({ title: "Followed! ⚡" });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: "Action failed" });
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchUserList = async (type: 'followers' | 'following') => {
    const targetId = viewingOtherUserId || user?.$id;
    if (!targetId) return;

    setFetchingList(true);
    setShowListModal(type);
    setUserList([]);

    try {
      const field = type === 'followers' ? 'followingId' : 'followerId';
      const response = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [
        Query.equal(field, targetId),
        Query.limit(50)
      ]);

      const otherField = type === 'followers' ? 'followerId' : 'followingId';
      const uids = response.documents.map((doc: any) => doc[otherField]);
      
      if (uids.length > 0) {
        const userDocs = await databases.listDocuments(DATABASE_ID, 'users', [
          Query.equal('$id', uids)
        ]);
        const formattedUsers = userDocs.documents.map((doc: any) => {
          const profile = JSON.parse(doc.profileData || '{}');
          return { ...doc, ...profile };
        });
        setUserList(formattedUsers);
      }
    } catch (error) {
      console.error("Error fetching list:", error);
    } finally {
      setFetchingList(false);
    }
  };

  const fetchUserVideos = async (targetId: string) => {
    try {
      setFetchingVideos(true);
      const response = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [Query.equal('uploaderUid', targetId), Query.orderDesc('$createdAt')]);
      setUserVideos(response.documents);
    } catch (error) {} finally {
      setFetchingVideos(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.$id) return;
    setIsUpdating(true);
    try {
      const currentDoc = await databases.getDocument(DATABASE_ID, 'users', user.$id);
      const profile = JSON.parse(currentDoc.profileData || '{}');
      const updated = { ...profile, displayName: editData.name, bio: editData.bio };
      await databases.updateDocument(DATABASE_ID, 'users', user.$id, { profileData: JSON.stringify(updated) });
      toast({ title: "Profile Updated ⚡" });
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update Failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || (viewingOtherUserId && !targetUser)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Syncing Profile...</p>
      </div>
    );
  }

  const isOwnProfile = !viewingOtherUserId || viewingOtherUserId === user?.$id;
  const totalLikes = userVideos.reduce((acc, v) => acc + (v.likesCount || 0), 0);

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar pb-24">
      <div className="p-6 flex flex-col items-center gap-6 pt-12">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all" />
          <Avatar className="w-28 h-28 border-4 border-black ring-2 ring-primary relative z-10">
            <AvatarImage src={targetUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.displayName || targetUser?.name || 'U')}&background=33F0FF&color=000`} alt={targetUser?.name} />
            <AvatarFallback className="bg-zinc-900 text-2xl font-bold">{targetUser?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-headline font-bold neon-text">{targetUser?.displayName || targetUser?.name || 'Viber'}</h1>
            {targetUser?.isVerified && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <p className="text-primary text-sm font-bold tracking-widest">{targetUser?.username || '@viber'}</p>
          <p className="text-muted-foreground text-xs mt-2 italic max-w-[280px]">
            {targetUser?.bio || 'Setting the stage for the next big vibe. ⚡'}
          </p>
        </div>

        <div className="flex gap-10 py-4 w-full justify-center">
          <div className="text-center cursor-pointer active:scale-95 transition-transform" onClick={() => fetchUserList('following')}>
            <p className="font-bold text-xl">{followingCount}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Following</p>
          </div>
          <div className="text-center border-x border-white/10 px-10 cursor-pointer active:scale-95 transition-transform" onClick={() => fetchUserList('followers')}>
            <p className="font-bold text-xl">{followersCount}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl">{totalLikes}</p>
            <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold">Likes</p>
          </div>
        </div>

        {isOwnProfile && (
          <Link href="/dashboard" className="w-full px-4 group">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-xl group-hover:border-primary/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  <span className="font-headline font-bold text-sm">Professional Dashboard</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                  Insights <ChevronRight className="w-3 h-3" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    {totalLikes * 12} <TrendingUp className="w-2 h-2 text-green-500" />
                  </span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Reached</span>
                </div>
                <div className="flex flex-col border-x border-white/10 px-2">
                  <span className="text-xs font-bold text-white">{totalLikes * 3}</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Visits</span>
                </div>
                <div className="flex flex-col pl-2">
                  <span className="text-xs font-bold text-white">{totalLikes}</span>
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Engaged</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="flex gap-3 w-full px-4">
          {isOwnProfile ? (
            <>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                  <DialogHeader><DialogTitle className="neon-text">Update Profile</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Display Name</label>
                      <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="bg-black border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Bio</label>
                      <Textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} className="bg-black border-white/10 resize-none h-24" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full bg-primary text-black font-bold">
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-white/10 bg-white/5 rounded-xl w-12 h-12">
                    <Settings className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-[#111] border-t border-white/10 rounded-t-[2.5rem] p-8 pb-12 outline-none">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-headline font-bold text-white neon-text text-left">Account Settings</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-between h-14 text-white hover:bg-white/5 rounded-2xl px-4" onClick={() => router.push('/monetization')}>
                      <div className="flex items-center gap-3"><Coins className="w-5 h-5 text-primary" /><span>Creator Monetization</span></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-between h-14 text-white hover:bg-white/5 rounded-2xl px-4" onClick={() => router.push('/privacy')}>
                      <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary" /><span>Privacy Policy</span></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-between h-14 text-white hover:bg-white/5 rounded-2xl px-4" onClick={() => router.push('/terms')}>
                      <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-primary" /><span>Terms of Service</span></div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <div className="h-px bg-white/5 my-2" />
                    <Button variant="ghost" className="w-full justify-between h-14 text-destructive hover:bg-destructive/10 rounded-2xl px-4" onClick={logout}>
                      <div className="flex items-center gap-3"><LogOut className="w-5 h-5" /><span>Logout</span></div>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Button 
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`flex-1 rounded-xl h-12 font-bold text-[10px] uppercase transition-all ${
                  isFollowing ? 'bg-zinc-800 text-white border border-white/5' : 'bg-primary text-black hover:bg-primary/90'
                }`}
              >
                {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold text-[10px] uppercase flex items-center gap-2" onClick={() => router.push(`/chat/${targetUser?.$id}`)}>
                <MessageSquare className="w-3 h-3" /> Message
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="videos" className="w-full flex-1 flex flex-col">
        <TabsList className="w-full bg-black border-b border-white/5 rounded-none p-0 h-14">
          <TabsTrigger value="videos" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"><Grid className="w-5 h-5" /></TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"><Heart className="w-5 h-5" /></TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all"><Bookmark className="w-5 h-5" /></TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="flex-1 bg-black p-0.5 m-0">
          {fetchingVideos ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
          ) : userVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5">
              {userVideos.map((video) => (
                <div key={video?.$id} className="relative aspect-[3/4] bg-zinc-900 overflow-hidden group cursor-pointer" onClick={() => router.push(`/?v=${video?.youtubeId}`)}>
                  <img src={video?.thumbnailUrl || `https://i.ytimg.com/vi/${video?.youtubeId}/hqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Vibe" />
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 text-white fill-white" />
                    <span className="text-[10px] font-bold text-white">{video?.likesCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center opacity-30 flex flex-col items-center gap-4">
              <Play className="w-8 h-8" />
              <p className="text-[10px] font-bold uppercase tracking-widest">No Vibes Posted</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="liked" className="p-20 text-center opacity-20 flex flex-col items-center gap-4"><Heart className="w-8 h-8" /><p className="text-[10px] font-bold uppercase tracking-widest">No Liked Vibes</p></TabsContent>
        <TabsContent value="saved" className="p-20 text-center opacity-20 flex flex-col items-center gap-4"><Bookmark className="w-8 h-8" /><p className="text-[10px] font-bold uppercase tracking-widest">No Saved Vibes</p></TabsContent>
      </Tabs>

      {/* Followers/Following List Modal */}
      <Dialog open={!!showListModal} onOpenChange={(open) => !open && setShowListModal(null)}>
        <DialogContent className="bg-black border-white/10 p-0 max-w-sm rounded-[2rem] overflow-hidden flex flex-col h-[70vh]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest neon-text">
              {showListModal === 'followers' ? 'Followers' : 'Following'}
            </h2>
            <DialogClose className="p-2 rounded-full hover:bg-white/5">
              <X className="w-4 h-4 text-white" />
            </DialogClose>
          </div>
          <ScrollArea className="flex-1 p-4">
            {fetchingList ? (
              <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : userList.length > 0 ? (
              <div className="space-y-4">
                {userList.map((listUser) => (
                  <div key={listUser.$id} className="flex items-center justify-between group">
                    <Link href={`/profile?id=${listUser.$id}`} className="flex items-center gap-3" onClick={() => setShowListModal(null)}>
                      <Avatar className="w-10 h-10 border border-white/5">
                        <AvatarImage src={listUser.photoURL} />
                        <AvatarFallback>{listUser.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold">{listUser.displayName || listUser.name}</p>
                        <p className="text-[10px] text-muted-foreground">{listUser.username}</p>
                      </div>
                    </Link>
                    <Button size="sm" variant="outline" className="h-8 rounded-full border-white/10 hover:bg-primary hover:text-black transition-colors" onClick={() => router.push(`/chat/${listUser.$id}`)}>
                      <MessageSquare className="w-3 h-3 mr-1" /> Message
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center opacity-30 flex flex-col items-center gap-4">
                <Grid className="w-8 h-8" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No users found</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-full bg-black gap-4"><Loader2 className="w-10 h-10 text-primary animate-spin" /><p className="text-primary text-[10px] font-bold uppercase tracking-widest">Syncing Profile...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}
