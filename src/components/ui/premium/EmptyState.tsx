import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="p-12 text-center flex flex-col items-center justify-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 m-4">
      <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-full text-purple-300 dark:text-purple-800 mb-4 shadow-sm">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-12 w-12" }) : icon}
      </div>
      <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{title}</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-500 max-w-sm mx-auto mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
