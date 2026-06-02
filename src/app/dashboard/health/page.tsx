import { prisma } from "@/db/prisma";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function HealthPage() {
  const latestSnapshots = await prisma.groupHealthSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    include: { group: true },
    distinct: ["groupId"], // get latest per group
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Health Monitor" 
        description="Community health scores, risk indicators, and overall vibrancy."
        icon={<HeartPulse className="w-8 h-8" />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {latestSnapshots.map((snap) => (
          <PremiumCard 
            key={snap.id}
            title={snap.group.groupName}
            description={`Score: ${snap.score.toFixed(1)}/100`}
            icon={<Activity className="w-5 h-5" />}
            action={
              <Badge variant={snap.score < 50 ? "destructive" : (snap.score < 80 ? "secondary" : "default")} className={snap.score >= 80 ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                {snap.score < 50 ? "Critical" : (snap.score < 80 ? "Warning" : "Healthy")}
              </Badge>
            }
          >
            <div className="grid grid-cols-2 gap-4 text-sm mt-2">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Engagement</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{snap.engagementScore.toFixed(1)}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Moderation</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{snap.moderationScore.toFixed(1)}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Spam Risk</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{snap.spamRiskScore.toFixed(1)}</span>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Retention</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{snap.retentionScore.toFixed(1)}</span>
              </div>
            </div>
          </PremiumCard>
        ))}
        {latestSnapshots.length === 0 && (
          <div className="col-span-1 md:col-span-2">
            <EmptyState 
              icon={<HeartPulse />}
              title="No Health Data Available"
              description="Health snapshots have not been generated yet. They are typically created automatically by background jobs."
            />
          </div>
        )}
      </div>
    </div>
  );
}
