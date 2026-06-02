import { prisma } from "@/db/prisma";
import { AnalyticsChart } from "./AnalyticsChart"; 
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { BarChart3, Activity } from "lucide-react";

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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="Analytics Engine" 
        description="Platform-wide trends, volume analysis, and historical trajectory."
        icon={<BarChart3 className="w-8 h-8" />}
      />

      <div className="grid gap-6">
        <PremiumCard 
          title="Global Message Volume (Daily)" 
          description="Aggregated across all tracked communities"
          icon={<Activity className="w-5 h-5" />}
        >
           <AnalyticsChart data={chartData} />
        </PremiumCard>
      </div>
    </div>
  );
}
