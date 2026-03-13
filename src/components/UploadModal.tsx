'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Film, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIDEOS_COLLECTION_ID = 'videos';

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setTitle('');
      setCaption('');
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
    if (!file) {
      alert('Please select a video file first.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Get Access Token
      const tokenRes = await fetch('/api/yt-token');
      const { access_token, error } = await tokenRes.json();
      
      if (error) throw new Error(error);

      // 2. Prepare YouTube Metadata
      const metadata = {
        snippet: {
          title: title || `Reloxo Vibe - ${new Date().toLocaleDateString()}`,
          description: caption,
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'unlisted',
          selfDeclaredMadeForKids: false,
        },
      };

      // 3. YouTube Multipart Upload
      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadataPart = 
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' + 
        JSON.stringify(metadata);

      const reader = new FileReader();
      
      const uploadPromise = new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const videoData = reader.result as ArrayBuffer;
            const multipartBody = new Uint8Array([
              ...new TextEncoder().encode(delimiter + metadataPart + delimiter + 'Content-Type: video/*\r\n\r\n'),
              ...new Uint8Array(videoData),
              ...new TextEncoder().encode(closeDelimiter)
            ]);

            const ytResponse = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${access_token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
              },
              body: multipartBody,
            });

            const ytData = await ytResponse.json();
            if (!ytResponse.ok) throw new Error(ytData.error?.message || 'YouTube upload failed');
            resolve(ytData.id);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsArrayBuffer(file);
      });

      const videoId = await uploadPromise as string;

      // 4. Save to Appwrite
      await databases.createDocument(
        DATABASE_ID,
        VIDEOS_COLLECTION_ID,
        ID.unique(),
        {
          youtubeId: videoId,
          title: title,
          caption: caption,
          uploaderUid: user?.$id || user?.uid,
          likesCount: 0,
        }
      );

      alert('Uploaded Successfully 🎉');
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={!isUploading ? onClose : undefined}
      />
      
      {/* Modal Container */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-xl bg-black sm:border sm:border-white/10 sm:rounded-[2.5rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="p-4 flex items-center justify-between border-b border-white/5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            disabled={isUploading}
            className="text-white hover:bg-white/5"
          >
            <X className="w-6 h-6" />
          </Button>
          <h2 className="text-lg font-headline font-bold neon-text">New Vibe</h2>
          <Button 
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="bg-primary text-black font-bold hover:bg-primary/90 px-6 rounded-full"
          >
            Post
          </Button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 hide-scrollbar pb-24">
          
          {/* Video Preview / Selector */}
          <div className="flex gap-4">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="relative w-32 aspect-[9/16] bg-white/5 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group overflow-hidden"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
              {previewUrl ? (
                <video 
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold text-center px-2">Choose File</span>
                </>
              )}
              {previewUrl && !isUploading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Film className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Video Title
                </label>
                <Input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Catchy title..."
                  className="bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary focus-visible:border-primary text-white"
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Caption & Hashtags</label>
                <Textarea 
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's the energy? #trending #reloxo"
                  className="bg-white/5 border-white/10 rounded-xl min-h-[120px] focus-visible:ring-primary focus-visible:border-primary resize-none text-white"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
            <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Pro Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">• Keep videos under 60 seconds for maximum reach.</li>
              <li className="flex items-start gap-2">• Vertical (9:16) aspect ratio is required.</li>
              <li className="flex items-start gap-2">• Add relevant hashtags to get discovered.</li>
            </ul>
          </div>
        </div>

        {/* Uploading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 z-[110] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-spin border-t-primary" />
              <Film className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-white mb-2 neon-text">Publishing your Vibe... 🚀</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Hang tight! We're processing your masterpiece and getting it ready for the Reloxo stage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
