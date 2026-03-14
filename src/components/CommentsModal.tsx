'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, MessageCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

const COMMENTS_COLLECTION_ID = 'comments';
const VIDEOS_COLLECTION_ID = 'videos';

export function CommentsModal({ isOpen, onClose, videoId }: CommentsModalProps) {
  const { user, openLoginModal } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen && videoId) {
      fetchComments();
    }
  }, [isOpen, videoId]);

  const fetchComments = async () => {
    setFetching(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        [
          Query.equal('videoId', videoId),
          Query.orderDesc('$createdAt'),
          Query.limit(100)
        ]
      );
      setComments(response.documents);
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      toast({
        variant: 'destructive',
        title: 'Fetch Error',
        description: error.message || 'Could not load comments.',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openLoginModal();
      return;
    }
    if (!newComment.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const commentData = {
        videoId: videoId,
        userId: user.$id || user.uid,
        text: newComment.trim(),
        username: user.username || user.displayName || 'User',
        userPhoto: user.photoURL || ''
      };

      await databases.createDocument(
        DATABASE_ID,
        COMMENTS_COLLECTION_ID,
        ID.unique(),
        commentData
      );

      // Try to update the count on the video
      try {
        const videoDoc = await databases.getDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId);
        await databases.updateDocument(DATABASE_ID, VIDEOS_COLLECTION_ID, videoId, {
          commentsCount: (videoDoc.commentsCount || 0) + 1
        });
      } catch (countError) {
        console.warn('Could not update comment count on video document', countError);
      }

      setNewComment('');
      await fetchComments();
    } catch (error: any) {
      console.error('Error sending comment:', error);
      alert('Error posting comment: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-[480px] h-[70vh] bg-[#0a0a0a] border-t border-white/10 rounded-t-[2rem] sm:rounded-[2rem] sm:border sm:h-[600px] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl">
        <header className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold uppercase tracking-widest text-white">Comments ({comments.length})</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50 hover:text-white hover:bg-white/5 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </header>

        <ScrollArea className="flex-1 p-4">
          {fetching ? (
            <div className="h-full flex items-center justify-center p-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6 pb-4">
              {comments.map((comment) => (
                <div key={comment.$id} className="flex gap-3 group">
                  <Avatar className="w-8 h-8 border border-white/10">
                    <AvatarImage src={comment.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username)}&background=33F0FF&color=000`} />
                    <AvatarFallback className="text-[10px] bg-zinc-900">{comment.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary tracking-wide">{comment.username}</span>
                      <span className="text-[9px] text-white/30 uppercase tracking-tighter">
                        {new Date(comment.$createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 py-20">
              <MessageCircle className="w-12 h-12" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">No comments yet</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <form onSubmit={handleSendComment} className="flex gap-2">
            <Input 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="bg-white/5 border-white/10 rounded-full h-10 focus-visible:ring-primary focus-visible:border-primary text-sm px-4"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newComment.trim() || isLoading}
              className="rounded-full bg-primary text-black hover:bg-primary/90 w-10 h-10"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}