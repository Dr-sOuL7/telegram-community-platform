import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AuditLogPage() {
  const logs = await prisma.dashboardAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Log</h2>
        <p className="text-muted-foreground">Immutable history of dashboard actions.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                <div>
                  <div className="font-semibold text-sm">
                    {log.user.name} ({log.user.email})
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <span className="font-mono bg-muted px-1 rounded text-xs mr-2">{log.action}</span>
                    {log.resourceType} {log.resourceId ? `(${log.resourceId})` : ""}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-sm text-muted-foreground">No audit logs available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
