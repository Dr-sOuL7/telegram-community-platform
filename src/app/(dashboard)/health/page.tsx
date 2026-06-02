import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HealthPage() {
  const latestSnapshots = await prisma.groupHealthSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    include: { group: true },
    distinct: ["groupId"], // get latest per group
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Health Monitor</h2>
        <p className="text-muted-foreground">Community health scores and risk indicators.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {latestSnapshots.map((snap) => (
          <Card key={snap.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">{snap.group.groupName}</CardTitle>
                <CardDescription>Score: {snap.score.toFixed(1)}/100</CardDescription>
              </div>
              <Badge variant={snap.score < 50 ? "destructive" : (snap.score < 80 ? "secondary" : "default")} className={snap.score >= 80 ? "bg-green-500" : ""}>
                {snap.score < 50 ? "Critical" : (snap.score < 80 ? "Warning" : "Healthy")}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagement</span>
                  <span className="font-semibold">{snap.engagementScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moderation</span>
                  <span className="font-semibold">{snap.moderationScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Spam Risk</span>
                  <span className="font-semibold">{snap.spamRiskScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Retention</span>
                  <span className="font-semibold">{snap.retentionScore.toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {latestSnapshots.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-2">No health snapshots generated yet.</p>
        )}
      </div>
    </div>
  );
}
