'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Grid, Heart, Bookmark, LogOut, Settings, Play, Shield, FileText, ChevronRight, MessageSquare, CheckCircle2, Loader2, Coins, Wallet, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { databases, DATABASE_ID, Query, COLLECTION_ID } from '@/lib/appwrite';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const VIDEOS_COLLECTION_ID = 'videos';

function ProfileContent() {
  const { user, logout, loading } = useAuth();
  const { toast } = useToast();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [userVideos, setUserVideos] = useState<any[]>([]);
  const [fetchingVideos, setFetchingVideos] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatorToolsOpen, setIsCreatorToolsOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '' });
  const [isUpdating, setIsUpdating] = useState(false);
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
        const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, viewingOtherUserId);
        const profile = JSON.parse(doc.profileData || '{}');
        setTargetUser({ ...doc, ...profile });
      } catch (e) {
        console.error('Error fetching target profile:', e);
      }
    };

    fetchTargetProfile();
  }, [viewingOtherUserId]);

  useEffect(() => {
    const targetId = viewingOtherUserId || user?.$id || user?.uid;
    if (targetId) {
      fetchUserVideos(targetId);
    } else if (!loading && !viewingOtherUserId) {
      setFetchingVideos(false);
    }
  }, [user, viewingOtherUserId, loading]);

  const fetchUserVideos = async (targetId: string) => {
    try {
      setFetchingVideos(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        [
          Query.equal('uploaderUid', targetId),
          Query.orderDesc('$createdAt')
        ]
      );
      setUserVideos(response.documents);
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setFetchingVideos(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.$id) return;
    setIsUpdating(true);
    try {
      const currentProfileDoc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, user.$id);
      const currentProfile = JSON.parse(currentProfileDoc.profileData || '{}');
      
      const updatedProfile = {
        ...currentProfile,
        displayName: editData.name,
        bio: editData.bio
      };

      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, user.$id, {
        profileData: JSON.stringify(updatedProfile)
      });

      toast({ title: "Profile Updated ⚡" });
      setIsEditing(false);
      window.location.reload();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || (viewingOtherUserId && !targetUser)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">Loading Vibe...</p>
      </div>
    );
  }

  const isOwnProfile = !viewingOtherUserId || viewingOtherUserId === (user?.$id || user?.uid);
  const walletProgress = Math.min(100, ((targetUser?.walletBalance || 0) / 8000) * 100);

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar pb-24">
      {viewingOtherUserId && (
        <button 
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-50 p-2 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="p-6 flex flex-col items-center gap-6 border-b border-white/5 pt-12 relative">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/40 transition-all" />
          <Avatar className="w-28 h-28 border-4 border-black ring-2 ring-primary relative z-10 shadow-[0_0_20px_rgba(51,240,255,0.3)]">
            <AvatarImage src={targetUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser?.displayName || targetUser?.name || 'U')}&background=33F0FF&color=000`} alt={targetUser?.name} />
            <AvatarFallback className="bg-zinc-900 text-2xl font-bold">{targetUser?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-headline font-bold neon-text">{targetUser?.displayName || targetUser?.name || 'Viber'}</h1>
            {targetUser?.isVerified && <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />}
          </div>
          <p className="text-primary text-sm font-bold tracking-widest">{targetUser?.username || '@viber'}</p>
          <p className="text-muted-foreground text-xs max-w-[250px] mt-2 line-clamp-2 italic px-4">
            {targetUser?.bio || 'Setting the stage for the next big vibe. ⚡'}
          </p>
        </div>

        <div className="flex gap-10 py-4 w-full justify-center">
          <div className="text-center">
            <p className="font-bold text-xl">0</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Following</p>
          </div>
          <div className="text-center border-x border-white/10 px-10">
            <p className="font-bold text-xl">0</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Followers</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-xl">{userVideos.reduce((acc, v) => acc + (v.likesCount || 0), 0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Likes</p>
          </div>
        </div>

        <div className="flex gap-3 w-full px-4">
          {isOwnProfile ? (
            <>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">Edit Vibe</Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-2xl">
                  <DialogHeader><DialogTitle className="neon-text">Update Profile</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Display Name</label>
                      <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="bg-black/50 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Bio</label>
                      <Textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} className="bg-black/50 border-white/10 resize-none h-24" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdateProfile} disabled={isUpdating} className="w-full bg-primary text-black font-bold">
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreatorToolsOpen} onOpenChange={setIsCreatorToolsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <Coins className="w-3 h-3 text-primary" />
                    Creator Tools
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-white/10 text-white rounded-[2.5rem]">
                  <DialogHeader>
                    <DialogTitle className="neon-text flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Creator Tools
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-8 text-center space-y-6">
                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Wallet Balance</p>
                        <span className="text-primary font-bold text-xs">₹8000 goal</span>
                      </div>
                      <h3 className="text-4xl font-headline font-bold text-white text-left">₹{targetUser?.walletBalance || 0}</h3>
                      <Progress value={walletProgress} className="h-2 bg-white/10" />
                    </div>
                    
                    <Button 
                      className={cn(
                        "w-full h-14 rounded-2xl font-bold uppercase tracking-widest transition-all",
                        (targetUser?.walletBalance || 0) >= 8000 
                          ? "bg-primary text-black shadow-[0_0_20px_rgba(51,240,255,0.4)] animate-pulse" 
                          : "bg-white/5 text-white/20 cursor-not-allowed"
                      )}
                      disabled={(targetUser?.walletBalance || 0) < 8000}
                    >
                      Withdraw ₹8000
                    </Button>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                      Minimum withdrawal threshold is ₹8000. Keep creating vibes!
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-white/10 bg-white/5 rounded-xl w-12 h-12">
                    <Settings className="w-4 h-4 text-white" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-[#111] border-t border-white/10 rounded-t-[2.5rem] p-8 pb-12 outline-none">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-headline font-bold text-white neon-text text-left">Settings</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-2">
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
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Button className="flex-1 bg-primary text-black hover:bg-primary/90 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px]">Follow</Button>
              <Button variant="outline" className="flex-1 border-white/10 bg-white/5 rounded-xl h-12 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2" onClick={() => alert("Redirecting to chat...")}>
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
                  <Image 
                    src={video?.thumbnailUrl || `https://img.youtube.com/vi/${video?.youtubeId}/0.jpg`}
                    alt={video?.title || "Vibe"}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    <Play className="w-2.5 h-2.5 text-white fill-white" />
                    <span className="text-[10px] font-bold text-white">{video?.likesCount || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-4 flex flex-col items-center opacity-30">
              <Play className="w-8 h-8" />
              <p className="text-[10px] uppercase tracking-widest font-bold">No Vibes Posted</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="liked" className="p-12 text-center flex flex-col items-center gap-4 opacity-20">
          <Heart className="w-10 h-10" />
          <p className="text-[10px] uppercase tracking-widest font-bold">No Liked Vibes</p>
        </TabsContent>
        
        <TabsContent value="saved" className="p-12 text-center flex flex-col items-center gap-4 opacity-20">
          <Bookmark className="w-10 h-10" />
          <p className="text-[10px] uppercase tracking-widest font-bold">No Saved Vibes</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex flex-col items-center justify-center h-full bg-black gap-4"><Loader2 className="w-10 h-10 text-primary animate-spin" /><p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">Loading Profile...</p></div>}>
      <ProfileContent />
    </Suspense>
  );
}
