import { prisma } from "@/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";

export default async function ReputationConsole() {
  const topUsers = await prisma.user.findMany({
    orderBy: { reputation: "desc" },
    take: 10,
  });

  const bottomUsers = await prisma.user.findMany({
    orderBy: { reputation: "asc" },
    take: 10,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Reputation Console" 
        description="Community sentiment and top contributors across all tracked groups."
        icon={<Star className="w-8 h-8" />}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <PremiumCard 
          title="Top Contributors" 
          description="Highest reputation users across all groups."
          icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          contentClassName="p-0"
        >
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {topUsers.map((user, idx) => (
              <li key={user.id} className="flex justify-between items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-400 dark:text-zinc-500 w-6 text-right">{idx + 1}.</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{user.firstName}</span>
                </div>
                <Badge className="font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 border-0">
                  {user.reputation}
                </Badge>
              </li>
            ))}
          </ul>
        </PremiumCard>

        <PremiumCard 
          title="Lowest Reputation" 
          description="Users needing potential moderation."
          icon={<TrendingDown className="w-5 h-5 text-red-500" />}
          contentClassName="p-0"
        >
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {bottomUsers.map((user, idx) => (
              <li key={user.id} className="flex justify-between items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-400 dark:text-zinc-500 w-6 text-right">{idx + 1}.</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{user.firstName}</span>
                </div>
                <Badge variant="destructive" className="font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border-0">
                  {user.reputation}
                </Badge>
              </li>
            ))}
          </ul>
        </PremiumCard>
      </div>
    </div>
  );
}
