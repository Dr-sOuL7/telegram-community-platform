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
import { UserCircle, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { reputation: "desc" },
    take: 100, // Limit for performance on overview, search will be separate
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="User Directory" 
        description="Top 100 users by reputation across all communities."
        icon={<Users className="w-8 h-8" />}
      />

      <PremiumCard 
        title="Global User Leaderboard" 
        icon={<UserCircle className="w-5 h-5" />}
        contentClassName="p-0"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
              <TableRow className="border-b-zinc-200 dark:border-b-zinc-800 hover:bg-transparent">
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">User</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Telegram ID</TableHead>
                <TableHead className="font-semibold text-zinc-700 dark:text-zinc-300">Status</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700 dark:text-zinc-300">Warnings</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700 dark:text-zinc-300">Reputation</TableHead>
                <TableHead className="text-right font-semibold text-zinc-700 dark:text-zinc-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 border-0 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <UserCircle className="h-5 w-5 text-purple-500" />
                        <span className="text-zinc-800 dark:text-zinc-200">{user.firstName} {user.username ? <span className="text-zinc-400 font-normal">(@{user.username})</span> : ""}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{user.telegramId.toString()}</TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 border-0 shadow-sm font-semibold">Active</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 border-0 shadow-sm font-semibold">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.warnings > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">{user.warnings}</span>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      <Badge className={`font-bold border-0 shadow-sm ${user.reputation < 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200"}`}>
                        {user.reputation}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/users/${user.id}`}>
                        <Button variant="outline" size="sm" className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 shadow-sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PremiumCard>
    </div>
  );
}
