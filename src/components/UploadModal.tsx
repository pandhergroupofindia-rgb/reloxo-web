'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Film, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';
import axios from 'axios';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIDEOS_COLLECTION_ID = 'videos';

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [visibility, setVisibility] = useState('public');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setTitle('');
      setCaption('');
      setUploadProgress(0);
      setUploadStatus('idle');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      const tokenRes = await fetch('/api/yt-token');
      const { access_token, error } = await tokenRes.json();
      if (error) throw new Error(error);

      const metadata = {
        snippet: {
          title: title || `Relox Vibe - ${new Date().toLocaleDateString()}`,
          description: `${caption}\n\n#relox #vibe #${category.toLowerCase()}`,
          categoryId: '22',
        },
        status: {
          privacyStatus: 'unlisted',
        },
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('video', file);

      const ytResponse = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
        formData,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Content-Type': 'multipart/related',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setUploadProgress(percentCompleted);
            if (percentCompleted === 100) setUploadStatus('processing');
          },
        }
      );

      const videoId = ytResponse.data.id;

      await databases.createDocument(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        ID.unique(),
        {
          youtubeId: videoId,
          title: title,
          caption: caption,
          category: category,
          visibility: visibility,
          uploaderUid: user.$id || user.uid,
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0
        }
      );

      setUploadStatus('success');
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert('Upload Error: ' + (err.response?.data?.error?.message || err.message));
      setIsUploading(false);
      setUploadStatus('idle');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={!isUploading ? onClose : undefined} />
      
      <div className="relative w-full h-full sm:h-auto sm:max-w-xl bg-black sm:border sm:border-white/10 sm:rounded-[2.5rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <header className="p-4 flex items-center justify-between border-b border-white/5">
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isUploading} className="text-white hover:bg-white/5">
            <X className="w-6 h-6" />
          </Button>
          <h2 className="text-lg font-headline font-bold neon-text">Publish Vibe</h2>
          <Button onClick={handleUpload} disabled={isUploading || !file} className="bg-primary text-black font-bold hover:bg-primary/90 px-6 rounded-full">
            Post
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar pb-24">
          <div className="flex flex-col sm:flex-row gap-6">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="relative w-full sm:w-48 aspect-[9/16] bg-white/5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-all group overflow-hidden"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
              {previewUrl ? (
                <video src={previewUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <>
                  <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors mb-4" />
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Select Video</span>
                </>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Title
                </label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The next viral hook..."
                  className="bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-white"
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Caption & Tags</label>
                <Textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell your story... #trending #relox"
                  className="bg-white/5 border-white/10 rounded-xl min-h-[100px] focus-visible:ring-primary focus-visible:border-primary resize-none text-white"
                  disabled={isUploading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Category</label>
                  <Select value={category} onValueChange={setCategory} disabled={isUploading}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Comedy">Comedy</SelectItem>
                      <SelectItem value="Gaming">Gaming</SelectItem>
                      <SelectItem value="Vlog">Vlog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Visibility</label>
                  <Select value={visibility} onValueChange={setVisibility} disabled={isUploading}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 z-[110] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            {uploadStatus === 'success' ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <CheckCircle2 className="w-20 h-20 text-secondary mb-4 drop-shadow-[0_0_15px_rgba(51,255,178,0.5)]" />
                <h3 className="text-2xl font-headline font-bold text-white mb-2 neon-text-secondary">Vibe Published! 🎉</h3>
                <p className="text-muted-foreground text-sm">Your masterpiece is live on the stage.</p>
              </div>
            ) : (
              <div className="w-full max-w-xs space-y-6">
                <div className="relative mx-auto w-24 h-24 mb-4">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div 
                    className="absolute inset-0 border-4 border-primary rounded-full animate-spin border-t-transparent" 
                    style={{ animationDuration: '1.5s' }}
                  />
                  <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-headline font-bold text-white neon-text">
                    Publishing Vibe... 🚀
                  </h3>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-medium">
                    {uploadStatus === 'uploading' ? `Sending Data: ${uploadProgress}%` : 'Processing for High Quality'}
                  </p>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-white/10" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
