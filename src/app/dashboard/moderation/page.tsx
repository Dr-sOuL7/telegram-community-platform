import { prisma } from "@/db/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Moderation Console</h2>
          <p className="text-muted-foreground">Global feed of all moderation actions.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Recent Actions (Top 50)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
             <p className="text-sm text-muted-foreground">No moderation actions yet.</p>
          ) : (
            <div className="space-y-4">
              {actions.map((action) => (
                <div key={action.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={action.actionType === 'BAN' ? 'bg-red-500/10 text-red-500' : ''}>
                        {action.actionType}
                      </Badge>
                      <span className="font-semibold text-sm">
                        {action.targetUser.firstName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        in {action.group.groupName}
                      </span>
                    </div>
                    {action.reason && (
                      <p className="text-sm text-muted-foreground italic">
                        Reason: {action.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <p>{new Date(action.createdAt).toLocaleDateString()}</p>
                    <p>by Admin: {action.moderator.firstName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
