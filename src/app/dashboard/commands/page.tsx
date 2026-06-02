import { prisma } from "@/db/prisma";
import { TerminalSquare, Command } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function CommandsPage() {
  const commandGroups = await prisma.commandUsage.groupBy({
    by: ['commandName'],
    _count: { commandName: true },
    _avg: { latencyMs: true },
    orderBy: { _count: { commandName: 'desc' } },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Command Analytics" 
        description="Usage patterns and latency metrics for Telegram commands."
        icon={<TerminalSquare className="w-8 h-8" />}
      />

      <PremiumCard 
        title="Command Execution Metrics" 
        icon={<Command className="w-5 h-5" />}
        contentClassName="p-0"
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {commandGroups.map((cmd) => (
            <div key={cmd.commandName} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
              <span className="font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-md text-sm font-semibold">{cmd.commandName}</span>
              <div className="flex gap-6 text-sm">
                <div className="flex flex-col items-end">
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold">{cmd._count.commandName}</span>
                  <span className="text-zinc-500 dark:text-zinc-500 text-xs uppercase tracking-wider">Uses</span>
                </div>
                <div className="flex flex-col items-end w-16">
                  <span className="text-amber-600 dark:text-amber-500 font-bold">~{Math.round(cmd._avg.latencyMs || 0)}</span>
                  <span className="text-zinc-500 dark:text-zinc-500 text-xs uppercase tracking-wider">ms avg</span>
                </div>
              </div>
            </div>
          ))}
          {commandGroups.length === 0 && (
            <EmptyState 
              icon={<TerminalSquare />}
              title="No Commands Executed"
              description="Users have not interacted with bot commands yet."
            />
          )}
        </div>
      </PremiumCard>
    </div>
  );
}
