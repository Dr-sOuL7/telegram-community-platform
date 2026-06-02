import { ReactNode } from "react";
import Link from "next/link";
import { Bot, ArrowLeft } from "lucide-react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] opacity-50" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">Sentinel<span className="text-primary">Intelligence</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/public/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Leaderboards
          </Link>
          <a href="https://t.me/CommunityManager1Bot?startgroup=true" target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]">
            Add Bot
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
