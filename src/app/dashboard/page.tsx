import { prisma } from "@/db/prisma";
import { Users, MessageSquare, ShieldAlert, Activity, LayoutDashboard, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function DashboardOverview() {
  const [
    totalGroups,
    totalUsers,
    totalMessages,
    totalModActions,
    avgHealth
  ] = await Promise.all([
    prisma.group.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.message.count(),
    prisma.moderationAction.count(),
    prisma.groupHealthSnapshot.aggregate({ _avg: { score: true } })
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Global Overview" 
        description="High-level metrics across all Telegram communities."
        icon={<LayoutDashboard className="w-8 h-8" />}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PremiumCard 
          title="Active Groups" 
          icon={<Users className="w-4 h-4" />}
          className="hover:-translate-y-1"
        >
          <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{totalGroups}</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium tracking-wide uppercase">Tracked Communities</p>
        </PremiumCard>
        
        <PremiumCard 
          title="Tracked Users" 
          icon={<Users className="w-4 h-4" />}
          className="hover:-translate-y-1"
        >
          <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{totalUsers}</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium tracking-wide uppercase">Across All Groups</p>
        </PremiumCard>

        <PremiumCard 
          title="Total Messages" 
          icon={<MessageSquare className="w-4 h-4" />}
          className="hover:-translate-y-1"
        >
          <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{totalMessages.toLocaleString()}</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium tracking-wide uppercase">Analyzed Interactions</p>
        </PremiumCard>

        <PremiumCard 
          title="Avg Health Score" 
          icon={<Activity className="w-4 h-4" />}
          className="hover:-translate-y-1"
        >
          <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">
            {avgHealth._avg.score ? avgHealth._avg.score.toFixed(1) : "N/A"}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 font-medium tracking-wide uppercase">Global Network Health</p>
        </PremiumCard>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <PremiumCard 
          title="Recent Activity" 
          icon={<TrendingUp className="w-5 h-5" />}
          className="col-span-4"
          contentClassName="p-0"
        >
          <EmptyState 
            icon={<TrendingUp />}
            title="Activity Data Generating"
            description="Detailed activity charts will render here shortly."
          />
        </PremiumCard>
        
        <PremiumCard 
          title="Recent Moderation" 
          icon={<ShieldAlert className="w-5 h-5" />}
          className="col-span-3"
          contentClassName="p-0"
        >
          <EmptyState 
            icon={<ShieldAlert />}
            title="No Recent Flags"
            description="Latest warnings, mutes, and bans will appear here."
          />
        </PremiumCard>
      </div>
    </div>
  );
}
