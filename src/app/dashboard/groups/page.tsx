import { prisma } from "@/db/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, LayoutGrid, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function GroupsPage() {
  const groups = await prisma.group.findMany({
    include: {
      metrics: true,
      settings: true,
      _count: {
        select: { roles: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Community Directory" 
        description="Manage and monitor all tracked Telegram communities."
        icon={<Users className="w-8 h-8" />}
      >
        <Button disabled variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
          <Plus className="w-4 h-4 mr-2" /> Add Group (Bot Only)
        </Button>
      </PageHeader>

      <PremiumCard 
        title="Tracked Groups" 
        icon={<LayoutGrid className="w-5 h-5" />}
        contentClassName="p-0"
      >
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            <TableRow className="border-b-zinc-100 dark:border-b-zinc-800">
              <TableHead className="text-zinc-600 dark:text-zinc-400 font-medium">Group Name</TableHead>
              <TableHead className="text-zinc-600 dark:text-zinc-400 font-medium">Telegram ID</TableHead>
              <TableHead className="text-zinc-600 dark:text-zinc-400 font-medium">Status</TableHead>
              <TableHead className="text-right text-zinc-600 dark:text-zinc-400 font-medium">Total Messages</TableHead>
              <TableHead className="text-right text-zinc-600 dark:text-zinc-400 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState 
                    icon={<Users />}
                    title="No groups currently tracked"
                    description="Add the bot to a Telegram group to begin tracking."
                  />
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id} className="border-b-zinc-100 dark:border-b-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md">
                        <Users className="h-4 w-4" />
                      </div>
                      {group.groupName}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{group.telegramGroupId.toString()}</TableCell>
                  <TableCell>
                    {group.isActive ? (
                      <Badge variant="default" className="bg-green-500 dark:bg-green-600 hover:bg-green-600 text-white">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-zinc-700 dark:text-zinc-300">{group.metrics?.totalMessages?.toLocaleString() || 0}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/groups/${group.id}`}>
                      <Button variant="outline" size="sm" className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </PremiumCard>
    </div>
  );
}
