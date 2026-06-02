import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: { group: true },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports Archive</h2>
        <p className="text-muted-foreground">Generated intelligence reports.</p>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <FileText className="text-primary w-5 h-5" />
                <CardTitle className="text-md">{report.title}</CardTitle>
              </div>
              <Badge variant="outline">{report.reportType}</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Group: {report.group.groupName} | Generated: {new Date(report.createdAt).toLocaleDateString()}
              </CardDescription>
              <div className="text-sm p-4 bg-muted rounded-md whitespace-pre-wrap font-mono">
                {report.summary}
              </div>
            </CardContent>
          </Card>
        ))}
        {reports.length === 0 && (
          <p className="text-muted-foreground text-sm">No reports generated yet.</p>
        )}
      </div>
    </div>
  );
}
