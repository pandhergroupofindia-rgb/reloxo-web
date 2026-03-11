"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Compass, Plus, Inbox, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Discover", href: "/discover" },
  { icon: Plus, label: "Upload", href: "/upload", isSpecial: true, protected: true },
  { icon: Inbox, label: "Inbox", href: "/inbox", protected: true },
  { icon: User, label: "Profile", href: "/profile", protected: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    if (item.protected && !user) {
      e.preventDefault();
      openLoginModal();
    }
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-black/80 backdrop-blur-lg border-t border-white/10 px-6 py-3 flex items-center justify-between z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        if (item.isSpecial) {
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item)}
              className="flex items-center justify-center -mt-8"
            >
              <div className="w-12 h-10 bg-primary rounded-lg flex items-center justify-center neon-border transition-transform active:scale-90 group">
                <Icon className="w-6 h-6 text-black" />
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={(e) => handleNavClick(e, item)}
            className={cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              isActive ? "text-primary" : "text-muted-foreground hover:text-white"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "neon-text")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
