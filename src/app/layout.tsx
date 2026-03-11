import type { Metadata } from 'next';
import './globals.css';
import { MobileWrapper } from '@/components/MobileWrapper';
import { BottomNav } from '@/components/BottomNav';
import { AuthProvider } from '@/context/AuthContext';
import { GlobalLoginModal } from '@/components/GlobalLoginModal';

export const metadata: Metadata = {
  title: 'Reloxo - Short Video Discovery',
  description: 'A futuristic dark neon short video experience.',
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
      <body className="font-body antialiased bg-black flex justify-center min-h-screen">
        <AuthProvider>
          <MobileWrapper>
            <main className="flex-1 overflow-hidden pb-20">
              {children}
            </main>
            <BottomNav />
            <GlobalLoginModal />
          </MobileWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
