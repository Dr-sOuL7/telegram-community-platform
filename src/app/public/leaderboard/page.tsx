import { prisma } from "@/db/prisma";
import { Trophy, Activity, Users } from "lucide-react";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  // Fetch top groups by health score (we need to join Group with the latest HealthSnapshot)
  // Since Prisma doesn't easily allow cross-table sorting by latest child, we'll fetch active groups and their latest snapshot
  const activeGroups = await prisma.group.findMany({
    where: { isActive: true },
    include: {
      healthSnapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      metrics: true,
    }
  });

  // Sort groups by health score in memory
  const rankedGroups = activeGroups
    .map(g => ({
      id: g.id,
      name: g.groupName,
      score: g.healthSnapshots[0]?.score || 0,
      messages: g.metrics?.totalMessages || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10

  // Fetch top users by reputation
  const topUsers = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { reputation: 'desc' },
    take: 10,
    select: { id: true, firstName: true, username: true, reputation: true }
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Global Leaderboards"
        description="The most engaging and healthiest communities on the Sentinel Network."
        icon={<Trophy className="w-8 h-8 text-secondary" />}
      />

      <div className="grid gap-8 md:grid-cols-2">
        {/* Top Communities */}
        <PremiumCard 
          title="Top Communities" 
          description="Ranked by Community Health Score"
          icon={<Activity className="w-5 h-5 text-primary" />}
          contentClassName="p-0"
        >
          <div className="divide-y divide-border/50">
            {rankedGroups.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No communities tracked yet.</div>
            ) : (
              rankedGroups.map((group, index) => (
                <Link href={`/public/groups/${group.id}`} key={group.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-secondary text-secondary-foreground shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                      index === 1 ? 'bg-zinc-300 text-zinc-800' :
                      index === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">{group.name}</div>
                      <div className="text-xs text-muted-foreground">{group.messages.toLocaleString()} messages</div>
                    </div>
                  </div>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">
                    {group.score}
                  </div>
                </Link>
              ))
            )}
          </div>
        </PremiumCard>

        {/* Top Users */}
        <PremiumCard 
          title="Top Users" 
          description="Ranked by Global Reputation"
          icon={<Users className="w-5 h-5 text-accent" />}
          contentClassName="p-0"
        >
          <div className="divide-y divide-border/50">
            {topUsers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No users tracked yet.</div>
            ) : (
              topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                      {user.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{user.firstName}</div>
                      {user.username && <div className="text-xs text-muted-foreground">@{user.username}</div>}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-secondary">
                    {user.reputation} <span className="text-xs text-muted-foreground font-normal">rep</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
}
