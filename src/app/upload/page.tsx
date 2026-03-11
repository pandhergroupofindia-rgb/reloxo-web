
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Video, Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function UploadPage() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [toast]);

  return (
    <div className="flex flex-col h-full bg-black text-white p-4">
      <h1 className="text-2xl font-headline font-bold mb-6 neon-text">Create Vibe</h1>

      <div className="relative aspect-[9/16] w-full max-w-[320px] mx-auto bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center group">
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover" 
          autoPlay 
          muted 
          playsInline
        />
        
        {!hasCameraPermission && hasCameraPermission !== null && (
          <div className="relative z-10 px-6 text-center">
            <Alert variant="destructive" className="bg-black/80 backdrop-blur-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No Access</AlertTitle>
              <AlertDescription>
                Allow camera access to start recording your next masterpiece.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
          <Button size="icon" variant="outline" className="w-12 h-12 rounded-full bg-black/20 border-white/20 hover:bg-white/10">
            <Upload className="w-5 h-5" />
          </Button>
          <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
            <div className="w-16 h-16 rounded-full bg-primary neon-border shadow-lg" />
          </div>
          <Button size="icon" variant="outline" className="w-12 h-12 rounded-full bg-black/20 border-white/20 hover:bg-white/10">
            <Video className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="mt-8 text-center text-muted-foreground text-xs px-12">
        <p>Short videos up to 60 seconds perform best. Keep the energy high! ⚡</p>
      </div>
    </div>
  );
}
