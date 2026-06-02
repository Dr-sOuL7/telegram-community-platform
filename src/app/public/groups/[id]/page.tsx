import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { Users, MessageSquare, Activity, ShieldAlert, Sparkles } from "lucide-react";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PageHeader } from "@/components/ui/premium/PageHeader";

export const dynamic = 'force-dynamic';

export default async function PublicGroupPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      metrics: true,
    }
  });

  if (!group) return notFound();

  // Fetch the latest health score
  const latestHealth = await prisma.groupHealthSnapshot.findFirst({
    where: { groupId: group.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <PageHeader 
          title={group.groupName}
          description="Public Community Intelligence Report"
          icon={<Users className="w-8 h-8" />}
        />
        <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-[0_0_15px_rgba(0,0,0,0.1)] ${group.isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-zinc-800 text-zinc-400"}`}>
          {group.isActive ? "🟢 Live Tracking Active" : "⏸️ Tracking Paused"}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <PremiumCard 
          title="Health Score" 
          icon={<Activity className="w-5 h-5" />}
          className="md:col-span-1"
        >
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-secondary">
              {latestHealth?.score || "N/A"}
            </div>
            <p className="text-sm text-muted-foreground mt-4 font-medium uppercase tracking-widest">Out of 100</p>
          </div>
        </PremiumCard>

        <div className="md:col-span-2 grid gap-6 sm:grid-cols-2">
          <PremiumCard title="Total Messages" icon={<MessageSquare className="w-4 h-4" />}>
            <div className="text-4xl font-extrabold text-foreground">{group.metrics?.totalMessages?.toLocaleString() || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">Analyzed by AI</p>
          </PremiumCard>
          
          <PremiumCard title="Community Size" icon={<Users className="w-4 h-4" />}>
            <div className="text-4xl font-extrabold text-foreground">{group.metrics?.newMembers?.toLocaleString() || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">Total joins tracked</p>
          </PremiumCard>
          
          <PremiumCard title="Moderation Events" icon={<ShieldAlert className="w-4 h-4" />}>
            <div className="text-4xl font-extrabold text-foreground">{group.metrics?.warningsIssued || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">Warnings issued</p>
          </PremiumCard>

          <PremiumCard title="Bot Commands" icon={<Sparkles className="w-4 h-4" />}>
            <div className="text-4xl font-extrabold text-foreground">{group.metrics?.totalCommands || 0}</div>
            <p className="text-sm text-muted-foreground mt-2">Commands executed</p>
          </PremiumCard>
        </div>
      </div>
      
      <div className="text-center py-12 border border-border/50 rounded-2xl bg-card/30 backdrop-blur-sm">
        <h3 className="text-2xl font-bold mb-4">Want these insights for your group?</h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">Add Sentinel Intelligence to your Telegram community to start tracking health, generating summaries, and automating moderation.</p>
        <a href="https://t.me/CommunityManager1Bot?startgroup=true" target="_blank" rel="noreferrer" className="inline-block px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)]">
          Add Bot Now
        </a>
      </div>
    </div>
  );
}
