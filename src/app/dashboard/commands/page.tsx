import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CommandsPage() {
  const commandGroups = await prisma.commandUsage.groupBy({
    by: ['commandName'],
    _count: { commandName: true },
    _avg: { latencyMs: true },
    orderBy: { _count: { commandName: 'desc' } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Command Analytics</h2>
        <p className="text-muted-foreground">Usage and latency of Telegram commands.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most Used Commands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {commandGroups.map((cmd) => (
              <div key={cmd.commandName} className="flex items-center justify-between border-b pb-2 last:border-0">
                <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{cmd.commandName}</span>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{cmd._count.commandName} uses</span>
                  <span>~{Math.round(cmd._avg.latencyMs || 0)}ms</span>
                </div>
              </div>
            ))}
            {commandGroups.length === 0 && (
              <p className="text-sm text-muted-foreground">No commands executed yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
