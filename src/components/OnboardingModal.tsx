'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnboardingModal() {
  const { isOnboardingOpen, pendingUser, completeOnboarding, closeOnboarding } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (pendingUser?.displayName) {
      const suggested = pendingUser.displayName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      setUsername(`@${suggested}`);
    }
  }, [pendingUser]);

  if (!isOnboardingOpen || !pendingUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await completeOnboarding(username, bio);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        closeOnboarding();
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#050505] border border-primary/30 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in duration-300">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 blur-[80px] rounded-full" />

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 neon-border">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-white neon-text mb-2">
              Welcome to the Vibe!
            </h2>
            <p className="text-muted-foreground">Profile created successfully 🎉</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-primary neon-border">
                    <AvatarImage src={pendingUser.photoURL || ''} />
                    <AvatarFallback className="text-2xl">{pendingUser.displayName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-secondary text-black rounded-full p-1.5 shadow-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-headline font-bold text-white neon-text">
                Setup your profile
              </h2>
              <p className="text-muted-foreground text-sm">
                How should the community know you?
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary px-1">Username</label>
                <Input 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@username"
                  className="bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary focus-visible:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-primary px-1">Bio</label>
                <Textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your vibe..."
                  className="bg-white/5 border-white/10 rounded-xl min-h-[100px] focus-visible:ring-primary focus-visible:border-primary resize-none"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={cn(
                "w-full h-14 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] neon-border",
                isSubmitting ? "opacity-50" : "bg-primary text-black hover:bg-primary/90"
              )}
            >
              {isSubmitting ? "Creating..." : "Complete Profile"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
