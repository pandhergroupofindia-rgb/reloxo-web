'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function OnboardingModal() {
  const { isOnboardingOpen, tempUser, completeOnboarding } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOnboardingOpen || !tempUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await completeOnboarding(username, bio);
    } catch (error) {
      console.error('Onboarding failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#050505] border border-primary/30 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in duration-300">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 blur-[80px] rounded-full" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 border-2 border-primary neon-border rounded-full flex items-center justify-center bg-muted overflow-hidden text-2xl font-bold">
                   {tempUser?.name?.charAt(0) || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-secondary text-black rounded-full p-1.5 shadow-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-headline font-bold text-white neon-text">
              Welcome to Relox, {tempUser.name}! 🚀
            </h2>
            <p className="text-muted-foreground text-sm">
              Let's set up your profile to join the community.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary px-1">Username</label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary focus-visible:border-primary text-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest font-bold text-primary px-1">Bio</label>
              <Textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your vibe..."
                className="bg-white/5 border-white/10 rounded-xl min-h-[100px] focus-visible:ring-primary focus-visible:border-primary resize-none text-white"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={cn(
                "w-full h-14 rounded-2xl text-lg font-bold transition-all active:scale-[0.98] neon-border",
                isSubmitting ? "opacity-70 cursor-not-allowed" : "bg-primary text-black hover:bg-primary/90"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
            
            <p className="text-[10px] text-center text-muted-foreground px-4 leading-relaxed">
              By continuing, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms</Link> & <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
