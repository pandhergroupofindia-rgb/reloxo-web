'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Coins, Wallet, Info, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';

export default function MonetizationPage() {
  const router = useRouter();
  const { user } = useAuth();

  const balance = user?.walletBalance || 0;
  const goal = 8000;
  const progress = Math.min(100, (balance / goal) * 100);

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="p-6 flex items-center gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-20 border-b border-white/5">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-headline font-bold neon-text">Monetization</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="relative group p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-white/10 shadow-2xl overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
          
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Current Balance</p>
                <h2 className="text-5xl font-headline font-bold">₹{balance}</h2>
              </div>
              <Wallet className="w-12 h-12 text-primary opacity-50" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Progress to Payout</span>
                <span className="text-primary">₹{goal} Threshold</span>
              </div>
              <Progress value={progress} className="h-3 bg-white/5 border border-white/5" />
              <p className="text-[10px] text-muted-foreground italic text-center">
                {balance >= goal 
                  ? "Threshold reached! You can now withdraw your earnings." 
                  : `You need ₹${goal - balance} more to unlock your first payout.`}
              </p>
            </div>

            <Button 
              className={`w-full h-14 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                balance >= goal 
                  ? "bg-primary text-black shadow-[0_0_30px_rgba(51,240,255,0.4)] animate-pulse" 
                  : "bg-white/5 text-white/30 cursor-not-allowed"
              }`}
              disabled={balance < goal}
            >
              {balance >= goal ? "Withdraw Funds 🚀" : "Keep Vibe-ing to Withdraw"}
            </Button>
          </div>
        </div>

        <section className="space-y-4">
          <h3 className="font-headline font-bold flex items-center gap-2 px-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Earnings Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: "Vibe Ad Revenue", amount: "₹0", icon: Coins },
              { label: "Creator Gifting", amount: "₹0", icon: Sparkles },
              { label: "Brand Partnerships", amount: "₹0", icon: ArrowRight },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-black rounded-xl">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="font-bold">{item.amount}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4">
          <div className="shrink-0 pt-1">
            <Info className="w-6 h-6 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Payouts are processed within 3-5 business days after withdrawal. Minimum payout threshold is strictly ₹8000 for standard accounts.
          </p>
        </section>
      </div>
    </div>
  );
}
