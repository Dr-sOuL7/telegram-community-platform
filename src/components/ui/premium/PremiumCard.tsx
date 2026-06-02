import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  action?: React.ReactNode;
}

export function PremiumCard({ title, description, icon, children, className, contentClassName, action }: PremiumCardProps) {
  return (
    <Card className={cn(
      "border-0 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden group",
      "bg-white dark:bg-zinc-950/50 dark:border dark:border-purple-500/10",
      className
    )}>
      <CardHeader className="bg-gradient-to-r from-zinc-50/80 to-purple-50/50 dark:from-zinc-900/80 dark:to-purple-900/20 border-b border-purple-100 dark:border-purple-900/30 flex flex-row items-center justify-between py-4 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full filter blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          {icon && (
            <div className="p-2 bg-gradient-to-br from-zinc-100 to-purple-100 dark:from-zinc-800 dark:to-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.2)] transition-all duration-300 border border-purple-200/50 dark:border-purple-700/30">
              {icon}
            </div>
          )}
          <div>
            <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5 text-zinc-500 dark:text-zinc-400">{description}</CardDescription>}
          </div>
        </div>
        
        {action && (
          <div className="relative z-10">
            {action}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn("p-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
