'use client';

import React, { useEffect } from 'react';

export function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="relative flex flex-col items-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
        
        {/* Animated Logo */}
        <div className="relative z-10 animate-in zoom-in duration-700 ease-out">
          <h1 className="text-7xl font-headline font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] tracking-tighter">
            Relox
          </h1>
          <div className="flex justify-center mt-2">
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full shadow-[0_0_10px_hsl(var(--primary))] animate-pulse" />
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="absolute bottom-[-60px] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
      
      <div className="absolute bottom-12 text-[10px] text-muted-foreground uppercase tracking-[0.5em] font-bold opacity-50">
        The Next Vibe Is Here
      </div>
    </div>
  );
}
