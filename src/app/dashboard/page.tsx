'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Eye, MousePointer2, Play, Sparkles, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const mockStats = [
    { label: 'Accounts Reached', value: '12.4K', change: '+18.2%', up: true, icon: Eye },
    { label: 'Content Interactions', value: '3,842', change: '+5.4%', up: true, icon: MousePointer2 },
    { label: 'Total Followers', value: '842', change: '-1.2%', up: false, icon: Users },
  ];

  const chartData = [40, 70, 55, 90, 65, 80, 45]; // mock view heights

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-y-auto hide-scrollbar">
      <header className="p-6 sticky top-0 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-headline font-bold neon-text flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          Professional Dashboard
        </h1>
      </header>

      <main className="p-6 space-y-8 pb-12">
        {/* Growth Grid */}
        <div className="grid grid-cols-1 gap-4">
          {mockStats.map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.up ? 'text-green-500' : 'text-red-500'}`}>
                {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Visual Insights */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline font-bold flex items-center gap-2">
              <Play className="w-4 h-4 text-primary" />
              Views Overview
            </h2>
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Last 7 Days</span>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex items-end justify-between h-48 gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-primary/5 blur-3xl rounded-full -translate-y-1/2" />
            
            {chartData.map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative z-10">
                <div 
                  className="w-full bg-primary/20 rounded-t-lg transition-all duration-500 group-hover:bg-primary/50 relative overflow-hidden"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_10px_#33F0FF]" />
                </div>
                <span className="text-[8px] text-muted-foreground font-bold uppercase">{['S','M','T','W','T','F','S'][i]}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Best Performance */}
        <section className="space-y-4">
          <h2 className="font-headline font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Top Content
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden relative border border-white/5">
                <img 
                  src={`https://picsum.photos/seed/vibe${i}/480/854`} 
                  className="w-full h-full object-cover opacity-60" 
                  alt="Vibe" 
                />
                <div className="absolute bottom-3 left-3">
                  <p className="text-[10px] font-bold text-white flex items-center gap-1">
                    <Eye className="w-3 h-3" /> 2.4K
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 text-center space-y-2">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Growth Tip</p>
          <p className="text-xs text-white/70 leading-relaxed">
            Posting between 7 PM and 9 PM increases your reach by 40% on weekends.
          </p>
        </div>
      </main>
    </div>
  );
}
