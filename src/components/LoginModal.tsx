'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div 
        className="relative w-full max-w-[480px] bg-[#111] rounded-t-[2.5rem] border-t border-primary p-8 pb-12 shadow-[0_-10px_40px_rgba(6,182,212,0.25)] animate-in slide-in-from-bottom duration-300 ease-out"
      >
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full" />

        <div className="flex justify-between items-start mb-6 pt-2">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-headline font-bold text-white neon-text">
              Join Relox 🚀
            </h2>
            <p className="text-muted-foreground text-sm">
              Discover, interact, and support creators on the next big vibe.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="space-y-6">
          <Button 
            onClick={handleLogin}
            className="w-full h-14 bg-white hover:bg-white/90 text-black font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </Button>
          
          <p className="text-[10px] text-center text-muted-foreground px-4 leading-relaxed">
            By joining, you agree to our <Link href="/terms" className="text-primary hover:underline" onClick={onClose}>Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline" onClick={onClose}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
