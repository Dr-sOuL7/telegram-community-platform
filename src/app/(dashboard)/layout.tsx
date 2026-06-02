import { ReactNode } from "react";
import Link from "next/link";
import { 
  BarChart3, 
  Users, 
  ShieldAlert, 
  Activity, 
  Settings, 
  LayoutDashboard, 
  Command, 
  FileText,
  History
} from "lucide-react";
import { auth, signOut } from "@/lib/auth/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Groups", href: "/dashboard/groups", icon: Users },
    { name: "Moderation", href: "/dashboard/moderation", icon: ShieldAlert },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Health", href: "/dashboard/health", icon: Activity },
    { name: "Reports", href: "/dashboard/reports", icon: FileText },
    { name: "Commands", href: "/dashboard/commands", icon: Command },
    { name: "Audit Log", href: "/dashboard/audit-log", icon: History },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r flex flex-col hidden md:flex">
        <div className="h-14 flex items-center px-4 border-b">
          <Command className="w-5 h-5 mr-2 text-primary" />
          <span className="font-semibold text-lg">Telegram Intel</span>
        </div>
        <div className="flex-1 overflow-auto py-4 flex flex-col gap-1 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-muted hover:text-foreground text-muted-foreground transition-colors"
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 md:px-6">
          <div className="md:hidden font-semibold">Telegram Intel</div>
          <div className="hidden md:flex flex-1"></div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session.user?.email}</p>
                    <p className="text-xs leading-none text-primary mt-1 font-semibold">{(session.user as any)?.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem>Log out</DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
