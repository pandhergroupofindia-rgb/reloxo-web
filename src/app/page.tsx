import { Feed } from '@/components/Feed';

export default function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 space-y-8">
      <h1 className="font-headline text-3xl font-bold neon-text text-primary text-center">
        Reloxo
      </h1>
      <div className="p-8 border-2 border-primary/20 rounded-2xl bg-primary/5 neon-border text-center">
        <p className="text-xl font-medium neon-text text-white">
          Reloxo - Server Connected 🚀
        </p>
      </div>
      <p className="text-muted-foreground text-center text-sm max-w-xs">
        Experience the future of short-form video. Seamless, neon-lit, and powered by AI.
      </p>
    </div>
  );
}
