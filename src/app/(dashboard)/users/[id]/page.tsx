import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Star } from "lucide-react";

export default async function UserDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      reputationHistory: { orderBy: { createdAt: "desc" }, take: 10 },
      receivedEvents: { orderBy: { createdAt: "desc" }, take: 10, include: { group: true } },
    }
  });

  if (!user) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {user.firstName} {user.username ? `(@${user.username})` : ""}
          </h2>
          <p className="text-muted-foreground font-mono text-sm">{user.telegramId.toString()}</p>
        </div>
        <div className="flex gap-2">
           <Badge variant={user.isActive ? "default" : "destructive"}>
             {user.isActive ? "Active" : "Banned/Inactive"}
           </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.reputation}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{user.warnings}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Reputation History</TabsTrigger>
          <TabsTrigger value="moderation">Moderation Events</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reputation Changes</CardTitle>
            </CardHeader>
            <CardContent>
               {user.reputationHistory.length === 0 ? (
                 <p className="text-sm text-muted-foreground">No reputation events yet.</p>
               ) : (
                 <ul className="space-y-4 text-sm">
                   {user.reputationHistory.map((h) => (
                     <li key={h.id} className="flex justify-between items-center border-b pb-2">
                       <div>
                         <span className="font-semibold">{h.sourceType}</span>
                         {h.reason && <span className="text-muted-foreground ml-2">({h.reason})</span>}
                       </div>
                       <div className={`font-bold ${h.delta > 0 ? "text-green-500" : "text-destructive"}`}>
                         {h.delta > 0 ? "+" : ""}{h.delta}
                       </div>
                     </li>
                   ))}
                 </ul>
               )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Recent Moderation Actions</CardTitle>
            </CardHeader>
            <CardContent>
               {user.receivedEvents.length === 0 ? (
                 <p className="text-sm text-muted-foreground">Clean record.</p>
               ) : (
                 <ul className="space-y-4 text-sm">
                   {user.receivedEvents.map((e) => (
                     <li key={e.id} className="flex justify-between items-center border-b pb-2">
                       <div>
                         <Badge variant="outline" className="mr-2">{e.actionType}</Badge>
                         <span>in {e.group.groupName}</span>
                         {e.reason && <span className="text-muted-foreground ml-2">Reason: {e.reason}</span>}
                       </div>
                       <div className="text-muted-foreground text-xs">
                         {new Date(e.createdAt).toLocaleDateString()}
                       </div>
                     </li>
                   ))}
                 </ul>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
