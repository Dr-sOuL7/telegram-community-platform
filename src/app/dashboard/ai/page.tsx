import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiSettingsRepo, communityInsightRepo, recommendationRepo } from "@/services/container";
import { env } from "@/config/env";
import { Lightbulb, Sparkles, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AIPage() {
  // Use a global dashboard group ID or fetch all for now
  const groupId = "global"; // For demo purposes, assuming global view or we'd select a group
  
  // Since we don't have a specific group selected in this dashboard structure by default, 
  // we'll fetch global or recent ones. We'll use a placeholder group ID or fetch everything if null.
  // Actually, we'll fetch recent insights across all groups.
  
  const insights = await communityInsightRepo.getInsights(groupId, 5);
  const recommendations = await recommendationRepo.getRecommendations(groupId, undefined, 5);
  const settings = await aiSettingsRepo.getGlobalSettings();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Intelligence</h2>
          <p className="text-muted-foreground">
            Autonomous insights, recommendations, and summaries for your community.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!env.FEATURE_AI ? (
            <Badge variant="destructive">AI Globally Disabled</Badge>
          ) : settings?.enabled ? (
            <Badge variant="default" className="bg-green-500">AI Active</Badge>
          ) : (
            <Badge variant="secondary">AI Paused</Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent insights generated.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {insights.map(insight => (
                  <div key={insight.id} className="flex items-start space-x-3 text-sm">
                    {insight.severity === 'critical' ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" /> :
                     insight.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" /> :
                     <Sparkles className="h-4 w-4 text-blue-500 mt-0.5" />}
                    <div>
                      <p className="font-medium capitalize">{insight.category}</p>
                      <p className="text-muted-foreground">{insight.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recommendations</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations at this time.</p>
            ) : (
              <div className="space-y-4 mt-4">
                {recommendations.map(rec => (
                  <div key={rec.id} className="flex flex-col space-y-1 text-sm border-b pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{rec.recommendation}</span>
                      <Badge variant={rec.priority === 'high' || rec.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">Category: {rec.category}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
          <CardDescription>Manage AI features and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Model</span>
              <span className="font-medium">{settings?.model || env.FEATURE_AI ? 'gpt-4o-mini' : 'Disabled'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Daily Cost Limit</span>
              <span className="font-medium">${((settings?.dailyCostLimitCents || 100) / 100).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Summarization</span>
              <Badge variant={settings?.summarizationEnabled ? "default" : "secondary"}>
                {settings?.summarizationEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground block">Insights</span>
              <Badge variant={settings?.insightsEnabled ? "default" : "secondary"}>
                {settings?.insightsEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
