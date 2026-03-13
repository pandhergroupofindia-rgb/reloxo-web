'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Film, Loader2 } from 'lucide-react';
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
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
          title: `Reloxo Vibe - ${new Date().toLocaleDateString()}`,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={!isUploading ? onClose : undefined}
      />
      
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-primary/30 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          disabled={isUploading}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-0"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-headline font-bold text-white neon-text">
            Drop Your Vibe ⚡
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Share your story with the Reloxo community.
          </p>
        </div>

        <div className="space-y-6">
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className="aspect-[16/9] rounded-2xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 transition-colors group"
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*"
              className="hidden"
            />
            {file ? (
              <div className="text-center p-4">
                <Film className="w-10 h-10 text-primary mx-auto mb-2" />
                <p className="text-xs text-white font-medium truncate max-w-[200px]">
                  {file.name}
                </p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm text-muted-foreground">Select Video File</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-primary px-1">Caption</label>
            <Textarea 
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's the energy today? #trending #reloxo"
              className="bg-white/5 border-white/10 rounded-xl min-h-[100px] focus-visible:ring-primary focus-visible:border-primary resize-none text-white"
              disabled={isUploading}
            />
          </div>

          <Button 
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="w-full h-14 rounded-2xl text-lg font-bold bg-primary text-black hover:bg-primary/90 transition-all active:scale-[0.98] neon-border disabled:opacity-50"
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Uploading... Please wait</span>
              </div>
            ) : (
              "Post Vibe"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
