import { prisma } from "@/db/prisma";
import { ShieldAlert, Activity, MessageSquare, ArrowRight, Bot } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const [totalGroups, totalMessages, totalUsers] = await Promise.all([
    prisma.group.count({ where: { isActive: true } }),
    prisma.message.count(),
    prisma.user.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px] opacity-50" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Sentinel<span className="text-primary">Intelligence</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <a href="https://t.me/CommunityManager1Bot?startgroup=true" target="_blank" rel="noreferrer" className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]">
            Add to Telegram
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          Next-Gen Community Management
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Supercharge your <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
            Telegram Community
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
          Sentinel Intelligence brings enterprise-grade analytics, AI-powered conversation summaries, and automated moderation directly into your Telegram groups.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <a href="https://t.me/CommunityManager1Bot?startgroup=true" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-primary-foreground bg-gradient-to-r from-primary to-accent rounded-full hover:opacity-90 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:-translate-y-1">
            Add Bot to Group
            <ArrowRight className="w-5 h-5" />
          </a>
          <Link href="/dashboard" className="px-8 py-4 text-lg font-semibold border border-border rounded-full hover:bg-card transition-all hover:-translate-y-1">
            View Live Dashboard
          </Link>
        </div>
      </main>

      {/* Stats Section */}
      <section className="relative z-10 border-y border-border/50 bg-card/30 backdrop-blur-sm py-12">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border/50">
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-4xl font-black mb-2 text-foreground">{totalGroups}</div>
            <div className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Active Communities</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-4xl font-black mb-2 text-foreground">{totalMessages.toLocaleString()}+</div>
            <div className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Messages Analyzed</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4">
            <div className="text-4xl font-black mb-2 text-foreground">{totalUsers.toLocaleString()}</div>
            <div className="text-sm font-medium tracking-widest text-muted-foreground uppercase">Tracked Users</div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to scale</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Stop guessing what your community wants. Let our AI analyze conversations and calculate health scores in real-time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl bg-card border border-border hover:border-primary/50 transition-colors group">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Summaries</h3>
            <p className="text-muted-foreground leading-relaxed">Catch up on thousands of messages instantly. Our AI generates concise summaries, extracts topics, and identifies action items.</p>
          </div>
          
          <div className="p-8 rounded-3xl bg-card border border-border hover:border-secondary/50 transition-colors group">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7 text-secondary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Health Scoring</h3>
            <p className="text-muted-foreground leading-relaxed">Know exactly how your community is performing with our proprietary 0-100 health score based on engagement and retention.</p>
          </div>

          <div className="p-8 rounded-3xl bg-card border border-border hover:border-destructive/50 transition-colors group">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-7 h-7 text-destructive" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Moderation</h3>
            <p className="text-muted-foreground leading-relaxed">Track warnings, mutes, and bans. Monitor spam risk and protect your community from toxic behavior automatically.</p>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Sentinel Intelligence. Built for premium Telegram communities.</p>
      </footer>
    </div>
  );
}
