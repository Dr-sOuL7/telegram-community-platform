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
  History,
  Sparkles
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
import { ThemeToggle } from "@/components/ThemeToggle";

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
    { name: "AI Intelligence", href: "/dashboard/ai", icon: Sparkles },
    { name: "Commands", href: "/dashboard/commands", icon: Command },
    { name: "Audit Log", href: "/dashboard/audit-log", icon: History },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex z-10">
        <div className="h-14 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="p-1.5 bg-gradient-to-br from-purple-500 to-amber-500 rounded-md mr-2 shadow-sm">
            <Command className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-amber-500 dark:from-purple-400 dark:to-amber-300">Telegram Intel</span>
        </div>
        <div className="flex-1 overflow-auto py-4 flex flex-col gap-1 px-3">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-2">Menu</div>
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-200 group"
              >
                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Subtle Background Glow for overall app */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none dark:opacity-20"></div>
        
        {/* Header */}
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 z-10">
          <div className="md:hidden font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-amber-500">Telegram Intel</div>
          <div className="hidden md:flex flex-1"></div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none ring-2 ring-transparent hover:ring-purple-400 transition-all">
                  <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700">
                    <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold">{session.user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="dark:bg-zinc-900 dark:border-zinc-800">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">{session.user?.name}</p>
                    <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">{session.user?.email}</p>
                    <p className="text-xs leading-none text-purple-600 dark:text-purple-400 mt-1 font-semibold uppercase tracking-wider">{(session.user as any)?.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="dark:bg-zinc-800" />
                <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
                  <button type="submit" className="w-full text-left">
                    <DropdownMenuItem className="cursor-pointer dark:focus:bg-zinc-800">Log out</DropdownMenuItem>
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-auto p-4 md:p-8 z-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
