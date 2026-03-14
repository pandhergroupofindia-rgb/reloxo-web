'use client';

import { useState } from 'react';
import { VideoFeed } from '@/components/VideoFeed';
import { SplashScreen } from '@/components/SplashScreen';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="h-full w-full bg-black">
      <VideoFeed />
    </div>
  );
}
