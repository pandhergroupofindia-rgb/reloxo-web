import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { AuthProvider } from '@/context/AuthContext';
import { GlobalLoginModal } from '@/components/GlobalLoginModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { Toaster } from '@/components/ui/toaster';
import { CookieBanner } from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: 'Relox - Short Video Discovery',
  description: 'A futuristic dark neon short video experience.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#050505] min-h-screen">
        <AuthProvider>
          <div className="max-w-[430px] mx-auto h-[100dvh] relative bg-black text-white overflow-hidden sm:border-x sm:border-white/10 shadow-2xl flex flex-col">
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
            <BottomNav />
            <GlobalLoginModal />
            <OnboardingModal />
            <CookieBanner />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
