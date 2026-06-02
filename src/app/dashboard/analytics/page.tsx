import { prisma } from "@/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalyticsChart } from "./AnalyticsChart"; 

export default async function AnalyticsDashboard() {
  const dailyMetrics = await prisma.dailyMetrics.findMany({
    orderBy: { date: "asc" },
    take: 100, // Reasonable limit for global aggregation
  });

  const chartDataMap = new Map<string, any>();
  dailyMetrics.forEach(m => {
    const d = m.date.toISOString().split("T")[0];
    if (!chartDataMap.has(d)) {
      chartDataMap.set(d, { name: d, messages: 0, activeUsers: 0 });
    }
    const curr = chartDataMap.get(d);
    curr.messages += m.messages;
    curr.activeUsers += m.activeUsers;
  });
  
  const chartData = Array.from(chartDataMap.values());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">Platform-wide trends and volume analysis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Message Volume (Daily)</CardTitle>
          <CardDescription>Aggregated across all tracked communities</CardDescription>
        </CardHeader>
        <CardContent>
           <AnalyticsChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
