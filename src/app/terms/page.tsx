'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
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
        <h1 className="text-xl font-headline font-bold neon-text">Terms of Service</h1>
      </header>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed pb-12">
        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Relox, you agree to be bound by these Terms of Service. If you do not agree, please do not use the app.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">2. Content Guidelines</h2>
          <p>
            Users are responsible for the content they upload. You must not post illegal, harmful, or copyright-infringing material. Relox reserves the right to remove any content that violates these guidelines.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">3. User Conduct</h2>
          <p>
            Respect other creators. Harassment, hate speech, and spamming are strictly prohibited and will result in permanent account suspension.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-white font-bold text-lg">4. Intellectual Property</h2>
          <p>
            You retain ownership of the content you create, but you grant Relox a worldwide license to host, display, and distribute your content within the platform.
          </p>
        </section>

        <section className="space-y-3 text-center pt-8 border-t border-white/5">
          <p className="italic">Last Updated: October 2023</p>
          <p>Enjoy the vibe. Stay original.</p>
        </section>
      </div>
    </div>
  );
}
