import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldAlert, Users, Settings as SettingsIcon, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <PageHeader 
          title={group.groupName}
          description={`ID: ${group.telegramGroupId.toString()}`}
          icon={<Users className="w-8 h-8" />}
        />
        <Badge variant={group.isActive ? "default" : "secondary"} className={`px-3 py-1 text-sm font-semibold shadow-sm ${group.isActive ? "bg-green-500 hover:bg-green-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}>
          {group.isActive ? "Active Tracking" : "Inactive"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400">Overview</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400">Members</TabsTrigger>
          <TabsTrigger value="moderation" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400">Moderation</TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <PremiumCard 
              title="Total Messages" 
              icon={<MessageSquare className="w-4 h-4" />}
            >
              <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{group.metrics?.totalMessages || 0}</div>
            </PremiumCard>
            
            <PremiumCard 
              title="Warnings Issued" 
              icon={<ShieldAlert className="w-4 h-4" />}
            >
              <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{group.metrics?.warningsIssued || 0}</div>
            </PremiumCard>
          </div>
        </TabsContent>

        <TabsContent value="members">
           <PremiumCard 
             title="Members" 
             icon={<Users className="w-5 h-5" />}
             contentClassName="p-0"
           >
             <EmptyState 
               icon={<Users />}
               title="Member Directory"
               description="Detailed member table coming soon."
             />
           </PremiumCard>
        </TabsContent>

        <TabsContent value="moderation">
           <PremiumCard 
             title="Moderation Logs" 
             icon={<ShieldAlert className="w-5 h-5" />}
             contentClassName="p-0"
           >
             <EmptyState 
               icon={<ShieldAlert />}
               title="Moderation Events"
               description="Recent moderation events for this group will appear here."
             />
           </PremiumCard>
        </TabsContent>

        <TabsContent value="settings">
           <PremiumCard 
             title="Group Settings Snapshot" 
             description="Read-only view of current group configuration."
             icon={<SettingsIcon className="w-5 h-5" />}
           >
             <pre className="text-xs bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-auto font-mono text-zinc-700 dark:text-zinc-300 shadow-inner">
               {JSON.stringify(group.settings, null, 2)}
             </pre>
           </PremiumCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
