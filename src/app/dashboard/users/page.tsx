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
import { UserCircle } from "lucide-react";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { reputation: "desc" },
    take: 100, // Limit for performance on overview, search will be separate
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Top 100 users by reputation across all groups.</p>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Warnings</TableHead>
              <TableHead className="text-right">Reputation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      {user.firstName} {user.username ? `(@${user.username})` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{user.telegramId.toString()}</TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="default" className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.warnings > 0 ? (
                      <span className="text-destructive font-bold">{user.warnings}</span>
                    ) : (
                      <span>0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <Badge variant={user.reputation < 0 ? "destructive" : "secondary"}>
                      {user.reputation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/users/${user.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
