import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reputation Console</h2>
        <p className="text-muted-foreground">Community sentiment and top contributors.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Top Contributors</CardTitle>
            <CardDescription>Highest reputation users across all groups.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {topUsers.map((user, idx) => (
                <li key={user.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted-foreground w-6">{idx + 1}.</span>
                    <span>{user.firstName}</span>
                  </div>
                  <Badge variant="secondary" className="font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {user.reputation}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Lowest Reputation</CardTitle>
            <CardDescription>Users needing potential moderation.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {bottomUsers.map((user, idx) => (
                <li key={user.id} className="flex justify-between items-center border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted-foreground w-6">{idx + 1}.</span>
                    <span>{user.firstName}</span>
                  </div>
                  <Badge variant="destructive" className="font-bold">
                    {user.reputation}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
