
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Grid, Heart, Bookmark, LogOut, Settings, Play, Shield, 
  FileText, ChevronRight, CheckCircle2, Loader2, Coins, 
  LayoutDashboard, Share2, Camera, X 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { databases, DATABASE_ID, Query } from '@/lib/appwrite';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

const VIDEOS_COLLECTION_ID = 'videos';
const FOLLOWERS_COLLECTION_ID = 'followers';
const LIKES_COLLECTION_ID = 'likes';
const SAVED_COLLECTION_ID = 'saved_videos';

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [savedVideos, setSavedVideos] = useState<any[]>([]);
  
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '', file: null as File | null });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfileStats();
    }
  }, [user]);

  const fetchProfileStats = async () => {
    if (!user) return;
    setStatsLoading(true);
    try {
      // 1. Own Videos
      const vids = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [
        Query.equal('uploaderUid', user.$id),
        Query.orderDesc('$createdAt')
      ]);
      setUserVideos(vids.documents);

      // 2. Followers/Following Counts
      const followers = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followingId', user.$id)]);
      setFollowersCount(followers.total);
      
      const following = await databases.listDocuments(DATABASE_ID, FOLLOWERS_COLLECTION_ID, [Query.equal('followerId', user.$id)]);
      setFollowingCount(following.total);

      // 3. Liked Videos
      const likesRes = await databases.listDocuments(DATABASE_ID, LIKES_COLLECTION_ID, [
        Query.equal('userId', user.$id),
        Query.limit(50)
      ]);
      if (likesRes.total > 0) {
        const likedIds = likesRes.documents.map(l => l.videoId);
        const likedVids = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [Query.equal('$id', likedIds)]);
        setLikedVideos(likedVids.documents);
      }

      // 4. Saved Videos
      const savedRes = await databases.listDocuments(DATABASE_ID, SAVED_COLLECTION_ID, [
        Query.equal('userId', user.$id),
        Query.limit(50)
      ]);
      if (savedRes.total > 0) {
        const savedIds = savedRes.documents.map(s => s.videoId);
        const savedVids = await databases.listDocuments(DATABASE_ID, VIDEOS_COLLECTION_ID, [Query.equal('$id', savedIds)]);
        setSavedVideos(savedVids.documents);
      }
    } catch (error) {
      console.error("Stats Load Error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      let finalPhotoURL = user.photoURL;
      if (editData.file) {
        const fd = new FormData();
        fd.append('file', editData.file);
        const res = await fetch('/api/upload-image', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        finalPhotoURL = data.secure_url;
      }

      const currentDoc = await databases.getDocument(DATABASE_ID, 'users', user.$id);
      const profile = JSON.parse(currentDoc.profileData || '{}');
      const updated = { 
        ...profile, 
        displayName: editData.name || profile.displayName, 
        bio: editData.bio || profile.bio, 
        photoURL: finalPhotoURL 
      };
      
      await databases.updateDocument(DATABASE_ID, 'users', user.$id, { 
        profileData: JSON.stringify(updated) 
      });
      
      toast({ title: 'Profile Updated! 🎉' });
      setIsEditing(false);
      window.location.reload();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/profile/${user?.$id}`;
    if (navigator.share) {
      navigator.share({ title: `${user?.displayName}'s Vibe`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard 🚀' });
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-primary text-[10px] font-bold uppercase tracking-widest">Loading Stage...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-6 p-8 text-center">
        <X className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">Please login to view your profile</h2>
        <Button onClick={() => router.push('/')} variant="outline" className="border-primary text-primary">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar pb-24">
      {/* Header Profile Section */}
      <div className="p-6 flex flex-col items-center gap-6 pt-12">
        <div className="relative">
          <Avatar className="w-28 h-28 border-4 border-black ring-2 ring-primary">
            <AvatarImage src={user.photoURL} />
            <AvatarFallback className="bg-zinc-900 text-2xl font-bold">{user.displayName?.[0]}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-headline font-bold neon-text">{user.displayName}</h1>
            {user.isVerified && <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />}
          </div>
          <p className="text-primary text-sm font-bold tracking-widest">{user.username}</p>
          <p className="text-muted-foreground text-xs mt-2 italic max-w-[280px]">{user.bio || 'Living for the next vibe. ⚡'}</p>
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

        <Link href="/dashboard" className="w-full px-4 mb-2">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center justify-between hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <span className="font-headline font-bold text-sm">Professional Dashboard</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>

        <div className="flex gap-3 w-full px-4">
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]"
                onClick={() => {
                  setEditData({ name: user.displayName, bio: user.bio, file: null });
                  setPreviewUrl(user.photoURL);
                }}
              >
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-[2.5rem]">
              <header className="text-center p-4"><h2 className="text-xl font-bold neon-text">Update Profile</h2></header>
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center gap-4">
                   <div className="relative group cursor-pointer" onClick={() => document.getElementById('pf-upload')?.click()}>
                      <Avatar className="w-24 h-24 border-2 border-primary">
                        <AvatarImage src={previewUrl || user.photoURL} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6" /></div>
                      <input 
                        id="pf-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setEditData(p => ({ ...p, file: f }));
                            setPreviewUrl(URL.createObjectURL(f));
                          }
                        }} 
                      />
                   </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-primary uppercase px-1">Display Name</label>
                  <Input 
                    value={editData.name} 
                    onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))} 
                    className="bg-white/5 border-white/10 rounded-xl" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-primary uppercase px-1">Bio</label>
                  <Textarea 
                    value={editData.bio} 
                    onChange={(e) => setEditData(p => ({ ...p, bio: e.target.value }))} 
                    className="bg-white/5 border-white/10 rounded-xl resize-none h-24" 
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2">
                <Button 
                  onClick={handleUpdateProfile} 
                  disabled={isUpdating} 
                  className="w-full bg-primary text-black font-bold h-12 rounded-xl"
                >
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
            <SheetContent side="bottom" className="bg-[#0a0a0a] border-t border-white/10 rounded-t-[2.5rem] p-6 pb-12 outline-none">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl font-bold text-white neon-text text-left">Account Hub</SheetTitle>
              </SheetHeader>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/manage-vibes')}>
                  <div className="flex items-center gap-3"><Play className="w-5 h-5 text-primary" /><span>Manage Vibes 🎬</span></div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/monetization')}>
                  <div className="flex items-center gap-3"><Coins className="w-5 h-5 text-primary" /><span>Monetization Setup 💰</span></div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/privacy')}>
                  <div className="flex items-center gap-3"><Shield className="w-5 h-5 text-primary" /><span>Privacy Policy</span></div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" className="w-full justify-between h-14 hover:bg-white/5 rounded-2xl" onClick={() => router.push('/terms')}>
                  <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-primary" /><span>Terms of Service</span></div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="h-px bg-white/5 my-2" />
                <Button variant="ghost" className="w-full justify-between h-14 text-destructive hover:bg-destructive/10 rounded-2xl" onClick={logout}>
                  <div className="flex items-center gap-3"><LogOut className="w-5 h-5" /><span>Logout</span></div>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button variant="outline" size="icon" className="border-white/10 bg-white/5 rounded-xl w-12 h-12" onClick={shareProfile}>
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="videos" className="w-full flex-1">
        <TabsList className="w-full bg-black border-b border-white/5 rounded-none p-0 h-14">
          <TabsTrigger value="videos" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Grid className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Heart className="w-5 h-5" />
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex-1 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary transition-all">
            <Bookmark className="w-5 h-5" />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="m-0 p-0.5">
          {statsLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : userVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-0.5">
              {userVideos.map((v) => (
                <div key={v.$id} className="relative aspect-[3/4] bg-zinc-900 group cursor-pointer" onClick={() => router.push(`/?v=${v.youtubeId}`)}>
                  <img src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/0.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Vibe" />
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
          {statsLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : likedVideos.length > 0 ? (
             <div className="grid grid-cols-3 gap-0.5">
              {likedVideos.map((v) => (
                <div key={v.$id} className="relative aspect-[3/4] bg-zinc-900 group cursor-pointer" onClick={() => router.push(`/?v=${v.youtubeId}`)}>
                  <img src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/0.jpg`} className="w-full h-full object-cover" alt="Liked" />
                </div>
              ))}
             </div>
          ) : (
            <div className="p-20 text-center opacity-20 flex flex-col items-center gap-4"><Heart className="w-8 h-8" /><p className="text-[10px] font-bold uppercase tracking-widest">No Liked Vibes</p></div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="m-0 p-0.5">
           {statsLoading ? (
            <div className="p-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : savedVideos.length > 0 ? (
             <div className="grid grid-cols-3 gap-0.5">
              {savedVideos.map((v) => (
                <div key={v.$id} className="relative aspect-[3/4] bg-zinc-900 group cursor-pointer" onClick={() => router.push(`/?v=${v.youtubeId}`)}>
                  <img src={v.thumbnailUrl || `https://img.youtube.com/vi/${v.youtubeId}/0.jpg`} className="w-full h-full object-cover" alt="Saved" />
                </div>
              ))}
             </div>
          ) : (
            <div className="p-20 text-center opacity-20 flex flex-col items-center gap-4"><Bookmark className="w-8 h-8" /><p className="text-[10px] font-bold uppercase tracking-widest">No Saved Vibes</p></div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
