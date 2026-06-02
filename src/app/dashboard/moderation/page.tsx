import { prisma } from "@/db/prisma";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, UserX, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function ModerationConsole() {
  const actions = await prisma.moderationAction.findMany({
    include: {
      targetUser: true,
      moderator: true,
      group: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Moderation Console" 
        description="Global feed of all automated and manual moderation actions."
        icon={<ShieldAlert className="w-8 h-8" />}
      />

      <PremiumCard 
        title="Recent Actions (Top 50)" 
        icon={<UserX className="w-5 h-5" />}
        contentClassName="p-0"
      >
        {actions.length === 0 ? (
          <EmptyState 
            icon={<ShieldAlert />}
            title="No Moderation Actions"
            description="Communities are peaceful. No warnings, mutes, or bans have been issued yet."
          />
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {actions.map((action) => (
              <div key={action.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={action.actionType === 'BAN' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'}>
                      {action.actionType}
                    </Badge>
                    <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                      {action.targetUser.firstName}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      in <span className="font-medium text-zinc-700 dark:text-zinc-300">{action.group.groupName}</span>
                    </span>
                  </div>
                  {action.reason && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 mt-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{action.reason}</span>
                    </p>
                  )}
                </div>
                <div className="text-xs text-zinc-400 text-right flex flex-col gap-1">
                  <span className="font-medium">{new Date(action.createdAt).toLocaleDateString()}</span>
                  <span className="text-purple-600 dark:text-purple-400">by {action.moderator.firstName}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
