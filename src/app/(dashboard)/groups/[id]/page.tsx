import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldAlert } from "lucide-react";

export default async function GroupDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      metrics: true,
      settings: true,
    }
  });

  if (!group) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{group.groupName}</h2>
          <p className="text-muted-foreground font-mono text-sm">{group.telegramGroupId.toString()}</p>
        </div>
        <Badge variant={group.isActive ? "default" : "secondary"} className={group.isActive ? "bg-green-500" : ""}>
          {group.isActive ? "Active Tracking" : "Inactive"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.metrics?.totalMessages || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings Issued</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{group.metrics?.warningsIssued || 0}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="members">
           <Card>
             <CardHeader><CardTitle>Members</CardTitle></CardHeader>
             <CardContent><p className="text-sm text-muted-foreground">Detailed member table coming soon.</p></CardContent>
           </Card>
        </TabsContent>
        <TabsContent value="moderation">
           <Card>
             <CardHeader><CardTitle>Moderation Logs</CardTitle></CardHeader>
             <CardContent><p className="text-sm text-muted-foreground">Recent moderation events for this group.</p></CardContent>
           </Card>
        </TabsContent>
        <TabsContent value="settings">
           <Card>
             <CardHeader>
               <CardTitle>Group Settings Snapshot</CardTitle>
               <CardDescription>Read-only view of current group configuration.</CardDescription>
             </CardHeader>
             <CardContent>
               <pre className="text-xs bg-muted p-4 rounded-md">
                 {JSON.stringify(group.settings, null, 2)}
               </pre>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
