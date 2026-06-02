import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiSettingsRepo, communityInsightRepo, recommendationRepo } from "@/services/container";
import { env } from "@/config/env";
import { Lightbulb, Sparkles, AlertTriangle, ShieldCheck, Zap, Activity } from "lucide-react";
import { PageHeader } from "@/components/ui/premium/PageHeader";
import { PremiumCard } from "@/components/ui/premium/PremiumCard";
import { EmptyState } from "@/components/ui/premium/EmptyState";

export default async function AIPage() {
  const groupId = "global"; 
  
  const insights = await communityInsightRepo.getInsights(groupId, 5);
  const recommendations = await recommendationRepo.getRecommendations(groupId, undefined, 5);
  const dbSettings = await aiSettingsRepo.getGlobalSettings();

  const isEnabled = dbSettings ? dbSettings.enabled : env.FEATURE_AI;
  const isSummarizationEnabled = dbSettings ? dbSettings.summarizationEnabled : env.FEATURE_SUMMARIZATION;
  const isInsightsEnabled = dbSettings ? dbSettings.insightsEnabled : env.FEATURE_AI_INSIGHTS;
  const isRecommendationsEnabled = dbSettings ? dbSettings.recommendationEnabled : env.FEATURE_AI_RECOMMENDATIONS;
  const modelName = dbSettings?.model || 'llama3-8b-8192';
  const dailyCostLimit = dbSettings?.dailyCostLimitCents || 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader 
        title="AI Intelligence" 
        description="Autonomous insights, powerful recommendations, and community summaries powered by Groq."
        icon={<Sparkles className="w-8 h-8" />}
      >
        {!env.FEATURE_AI ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
            <span className="font-semibold text-sm tracking-wide text-white">Globally Disabled</span>
          </div>
        ) : isEnabled ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="font-semibold text-sm tracking-wide uppercase text-white">Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>
            <span className="font-semibold text-sm tracking-wide text-white">Paused in Settings</span>
          </div>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <PremiumCard 
          title="Recent Insights" 
          icon={<Lightbulb className="w-5 h-5" />}
          action={
            <Badge variant={isInsightsEnabled ? "default" : "secondary"} className={isInsightsEnabled ? "bg-amber-500 hover:bg-amber-600 text-black" : ""}>
              {isInsightsEnabled ? "Online" : "Offline"}
            </Badge>
          }
          contentClassName="p-0"
        >
          {insights.length === 0 ? (
            <EmptyState 
              icon={<Activity />} 
              title="Awaiting Community Data" 
              description="Insights will appear as the AI processes chat activity." 
            />
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {insights.map(insight => (
                <div key={insight.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex items-start gap-4 text-sm">
                  {insight.severity === 'critical' ? (
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md shrink-0"><AlertTriangle className="h-4 w-4" /></div>
                  ) : insight.severity === 'warning' ? (
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md shrink-0"><AlertTriangle className="h-4 w-4" /></div>
                  ) : (
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-md shrink-0"><Sparkles className="h-4 w-4" /></div>
                  )}
                  <div>
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize mb-0.5">{insight.category}</p>
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{insight.insight}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>

        <PremiumCard 
          title="Actionable Recommendations" 
          icon={<ShieldCheck className="w-5 h-5" />}
          action={
            <Badge variant={isRecommendationsEnabled ? "default" : "secondary"} className={isRecommendationsEnabled ? "bg-amber-500 hover:bg-amber-600 text-black" : ""}>
              {isRecommendationsEnabled ? "Online" : "Offline"}
            </Badge>
          }
          contentClassName="p-0"
        >
          {recommendations.length === 0 ? (
            <EmptyState 
              icon={<ShieldCheck />} 
              title="Everything looks optimal" 
              description="Recommendations will be generated if issues arise." 
            />
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recommendations.map(rec => (
                <div key={rec.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors flex flex-col gap-2 text-sm">
                  <div className="flex justify-between items-start gap-4">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">{rec.recommendation}</span>
                    <Badge variant={rec.priority === 'high' || rec.priority === 'critical' ? 'destructive' : 'secondary'} className="shrink-0 shadow-sm">
                      {rec.priority}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Category: {rec.category}</span>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>
      </div>
      
      <PremiumCard 
        title="Configuration Status" 
        description="Current operational parameters for the AI Engine"
        icon={<Zap className="w-5 h-5" />}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider block mb-1">Active Model</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-base">{modelName}</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-amber-200 dark:hover:border-amber-800 transition-colors">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider block mb-1">Daily Safety Cap</span>
            <span className="font-bold text-amber-600 dark:text-amber-500 text-base">${(dailyCostLimit / 100).toFixed(2)}</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider block mb-2">Summarization</span>
            <Badge variant={isSummarizationEnabled ? "default" : "secondary"} className={isSummarizationEnabled ? "bg-purple-600 text-white" : ""}>
              {isSummarizationEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium text-xs uppercase tracking-wider block mb-2">Data Processing</span>
            <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-purple-600 text-white" : ""}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
