import React from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon, children }: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-purple-900 to-black p-8 text-white shadow-xl border border-purple-500/20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <div className="text-amber-400 scale-150 transform translate-x-4 -translate-y-4">
          {icon}
        </div>
      </div>
      
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black/40 rounded-xl backdrop-blur-md border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
            {icon}
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-amber-200 drop-shadow-sm">
              {title}
            </h2>
            <p className="text-purple-200/80 max-w-xl text-lg font-medium">
              {description}
            </p>
          </div>
        </div>
        
        {children && (
          <div className="flex items-center gap-3 bg-black/30 px-4 py-3 rounded-xl backdrop-blur-md border border-purple-500/30">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
