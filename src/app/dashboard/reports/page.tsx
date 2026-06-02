import { prisma } from "@/db/prisma";
import { Badge } from "@/components/ui/badge";
import { FileText, Files } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { group: true },
    take: 50,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Reports Archive" 
        description="Access and review generated intelligence reports."
        icon={<Files className="w-8 h-8" />}
      />

      <div className="grid gap-6">
        {reports.map((report) => (
          <PremiumCard 
            key={report.id}
            title={report.title}
            description={`Group: ${report.group.groupName} | Generated: ${new Date(report.createdAt).toLocaleDateString()}`}
            icon={<FileText className="w-5 h-5" />}
            action={
              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 hover:bg-purple-200 border-0">{report.reportType}</Badge>
            }
          >
            <div className="text-sm p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800 whitespace-pre-wrap font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed shadow-inner">
              {report.summary}
            </div>
          </PremiumCard>
        ))}
        {reports.length === 0 && (
          <EmptyState 
            icon={<FileText />}
            title="No Reports Generated"
            description="Intelligence reports will appear here once requested or scheduled."
          />
        )}
      </div>
    </div>
  );
}
