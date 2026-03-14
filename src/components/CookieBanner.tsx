'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[9999] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-black/90 backdrop-blur-xl border border-primary/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(51,240,255,0.15)] space-y-3">
        <p className="text-[11px] text-white/80 leading-relaxed text-center">
          We use cookies to improve your vibe. By using Relox, you agree to our{' '}
          <Link href="/privacy" className="text-primary hover:underline font-bold">Privacy Policy</Link>.
        </p>
        <Button 
          onClick={handleAccept}
          className="w-full bg-primary text-black font-bold h-10 rounded-xl hover:bg-primary/90 transition-all active:scale-95 text-xs uppercase tracking-widest"
        >
          Accept Vibe
        </Button>
      </div>
    </div>
  );
}
