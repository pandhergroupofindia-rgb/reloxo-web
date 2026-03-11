
"use client";

import { ReactNode } from "react";

export function MobileWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[480px] h-[100dvh] flex flex-col relative bg-black border-x border-white/5 shadow-2xl overflow-hidden">
      {children}
    </div>
  );
}
