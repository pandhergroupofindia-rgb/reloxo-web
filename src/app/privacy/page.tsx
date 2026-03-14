'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full bg-black text-white p-6 overflow-y-auto hide-scrollbar">
      <header className="flex items-center gap-4 mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/')}
          className="rounded-full bg-white/5"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-headline font-bold neon-text">Privacy Policy</h1>
      </header>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed pb-12">
        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">1. Introduction</h2>
          <p>
            Welcome to Relox. Your privacy is paramount to us. This policy describes how we collect, use, and protect your information when you use our short-video platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">2. Data We Collect</h2>
          <p>
            We collect information you provide directly to us, such as your username, bio, and content you upload. We also collect data through your interactions with the app, including videos watched and likes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">3. How We Use Data</h2>
          <p>
            We use your data to personalize your "For You" feed, enable social interactions, and improve the overall performance and security of Relox.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">4. Data Sharing</h2>
          <p>
            We do not sell your personal data. We only share information with third-party services (like YouTube for video hosting or Cloudinary for image storage) as necessary to provide app functionality.
          </p>
        </section>

        <section className="space-y-3 text-center pt-8 border-t border-white/5">
          <p className="italic">Last Updated: October 2023</p>
          <p>Contact us at privacy@relox.app for any questions.</p>
        </section>
      </div>
    </div>
  );
}
