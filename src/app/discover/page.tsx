
'use client';

import { Input } from '@/components/ui/input';
import { Search, TrendingUp, Music2, Camera, Gamepad2 } from 'lucide-react';

const categories = [
  { icon: TrendingUp, name: 'Trending' },
  { icon: Music2, name: 'Music' },
  { icon: Camera, name: 'Photography' },
  { icon: Gamepad2, name: 'Gaming' },
];

export default function DiscoverPage() {
  return (
    <div className="flex flex-col h-full bg-black text-white p-4 gap-6">
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          className="bg-white/5 border-white/10 pl-10 focus-visible:ring-primary" 
          placeholder="Search creators and vibes..." 
        />
      </div>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {categories.map((cat) => (
          <div 
            key={cat.name}
            className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full whitespace-nowrap hover:border-primary/50 cursor-pointer transition-colors"
          >
            <cat.icon className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{cat.name}</span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-headline font-bold text-lg neon-text">Featured Tags</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-white/10 flex items-center justify-center p-4 text-center">
            <span className="font-bold text-primary">#MumbaiNights</span>
          </div>
          <div className="aspect-video rounded-xl bg-gradient-to-br from-secondary/20 to-blue-500/20 border border-white/10 flex items-center justify-center p-4 text-center">
            <span className="font-bold text-secondary">#FutureIndie</span>
          </div>
        </div>
      </div>
    </div>
  );
}
