import { prisma } from "@/db/prisma";
import { History, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function AuditLogPage() {
  const logs = await prisma.dashboardAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
    take: 100,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Audit Log" 
        description="Immutable history of dashboard actions and configuration changes."
        icon={<History className="w-8 h-8" />}
      />

      <PremiumCard 
        title="Recent System Actions" 
        icon={<Activity className="w-5 h-5" />}
        contentClassName="p-0"
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-start justify-between">
              <div>
                <div className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                  {log.user.name} <span className="text-zinc-500 font-normal ml-1">({log.user.email})</span>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 flex items-center">
                  <span className="font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded text-xs font-semibold tracking-wide mr-2 shadow-sm border border-amber-200 dark:border-amber-800">{log.action}</span>
                  <span>{log.resourceType} {log.resourceId ? <span className="font-mono text-xs ml-1 text-purple-600 dark:text-purple-400">[{log.resourceId}]</span> : ""}</span>
                </div>
              </div>
              <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <EmptyState 
              icon={<History />}
              title="Audit Log Empty"
              description="No administrative actions have been recorded yet."
            />
          )}
        </div>
      </PremiumCard>
    </div>
  );
}
