import { prisma } from "@/db/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Star, UserCircle, History, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <PageHeader 
          title={`${user.firstName} ${user.username ? `(@${user.username})` : ""}`}
          description={`Telegram ID: ${user.telegramId.toString()}`}
          icon={<UserCircle className="w-8 h-8" />}
        />
        <div className="flex gap-2">
           <Badge variant={user.isActive ? "default" : "destructive"} className={`px-3 py-1 text-sm font-semibold shadow-sm ${user.isActive ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}>
             {user.isActive ? "Active" : "Banned/Inactive"}
           </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PremiumCard 
          title="Reputation Score" 
          icon={<Star className="w-4 h-4 text-amber-500" />}
        >
          <div className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100">{user.reputation}</div>
        </PremiumCard>
        
        <PremiumCard 
          title="Total Warnings" 
          icon={<AlertCircle className="w-4 h-4 text-red-500" />}
        >
          <div className="text-3xl font-extrabold text-red-600 dark:text-red-500">{user.warnings}</div>
        </PremiumCard>
      </div>

      <Tabs defaultValue="history" className="space-y-6">
        <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md p-1">
          <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400">Reputation History</TabsTrigger>
          <TabsTrigger value="moderation" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400">Moderation Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history">
          <PremiumCard 
            title="Recent Reputation Changes" 
            icon={<History className="w-5 h-5" />}
            contentClassName="p-0"
          >
             {user.reputationHistory.length === 0 ? (
               <EmptyState 
                 icon={<Star />}
                 title="No Reputation History"
                 description="This user has not received any reputation points yet."
               />
             ) : (
               <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {user.reputationHistory.map((h) => (
                   <li key={h.id} className="p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                     <div>
                       <span className="font-semibold text-zinc-800 dark:text-zinc-200">{h.sourceType}</span>
                       {h.reason && <span className="text-zinc-500 dark:text-zinc-400 ml-2 text-sm">({h.reason})</span>}
                     </div>
                     <Badge className={`font-bold border-0 shadow-sm ${h.delta > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200"}`}>
                       {h.delta > 0 ? "+" : ""}{h.delta}
                     </Badge>
                   </li>
                 ))}
               </ul>
             )}
          </PremiumCard>
        </TabsContent>

        <TabsContent value="moderation">
          <PremiumCard 
            title="Recent Moderation Actions" 
            icon={<ShieldAlert className="w-5 h-5" />}
            contentClassName="p-0"
          >
             {user.receivedEvents.length === 0 ? (
               <EmptyState 
                 icon={<ShieldAlert />}
                 title="Clean Record"
                 description="This user has not been involved in any moderation events."
               />
             ) : (
               <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                 {user.receivedEvents.map((e) => (
                   <li key={e.id} className="p-4 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className={`border-purple-500/20 ${e.actionType === 'BAN' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'}`}>{e.actionType}</Badge>
                         <span className="text-sm text-zinc-600 dark:text-zinc-300">in <span className="font-medium text-zinc-800 dark:text-zinc-200">{e.group.groupName}</span></span>
                       </div>
                       {e.reason && <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5 mt-1"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><span>{e.reason}</span></p>}
                     </div>
                     <div className="text-xs font-medium text-zinc-400 dark:text-zinc-500 text-right">
                       {new Date(e.createdAt).toLocaleDateString()}
                     </div>
                   </li>
                 ))}
               </ul>
             )}
          </PremiumCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
