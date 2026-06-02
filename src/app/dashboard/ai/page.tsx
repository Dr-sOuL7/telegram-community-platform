import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { aiSettingsRepo, communityInsightRepo, recommendationRepo } from "@/services/container";
import { env } from "@/config/env";
import { Lightbulb, Sparkles, AlertTriangle, ShieldCheck, Zap, Activity } from "lucide-react";

export default async function AIPage() {
  const groupId = "global"; 
  
  const insights = await communityInsightRepo.getInsights(groupId, 5);
  const recommendations = await recommendationRepo.getRecommendations(groupId, undefined, 5);
  const dbSettings = await aiSettingsRepo.getGlobalSettings();

  // Fallback to env vars if database settings haven't been configured yet
  const isEnabled = dbSettings ? dbSettings.enabled : env.FEATURE_AI;
  const isSummarizationEnabled = dbSettings ? dbSettings.summarizationEnabled : env.FEATURE_SUMMARIZATION;
  const isInsightsEnabled = dbSettings ? dbSettings.insightsEnabled : env.FEATURE_AI_INSIGHTS;
  const isRecommendationsEnabled = dbSettings ? dbSettings.recommendationEnabled : env.FEATURE_AI_RECOMMENDATIONS;
  const modelName = dbSettings?.model || 'llama3-8b-8192';
  const dailyCostLimit = dbSettings?.dailyCostLimitCents || 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <Sparkles className="h-32 w-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-2 drop-shadow-sm">AI Intelligence</h2>
            <p className="text-indigo-100 max-w-xl text-lg font-medium">
              Autonomous insights, powerful recommendations, and community summaries powered by Groq.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/20 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/10">
            {!env.FEATURE_AI ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-semibold text-sm tracking-wide">Globally Disabled</span>
              </div>
            ) : isEnabled ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="font-semibold text-sm tracking-wide uppercase">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
                <span className="font-semibold text-sm tracking-wide">Paused in Settings</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Insights Card */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden group">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                <Lightbulb className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-800">Recent Insights</CardTitle>
            </div>
            <Badge variant={isInsightsEnabled ? "default" : "secondary"} className={isInsightsEnabled ? "bg-blue-500 hover:bg-blue-600" : ""}>
              {isInsightsEnabled ? "Online" : "Offline"}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {insights.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <Activity className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Awaiting Community Data...</p>
                <p className="text-xs text-slate-400 mt-1">Insights will appear as the AI processes chat activity.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {insights.map(insight => (
                  <div key={insight.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 text-sm">
                    {insight.severity === 'critical' ? (
                      <div className="p-1.5 bg-red-100 text-red-600 rounded-md shrink-0"><AlertTriangle className="h-4 w-4" /></div>
                    ) : insight.severity === 'warning' ? (
                      <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md shrink-0"><AlertTriangle className="h-4 w-4" /></div>
                    ) : (
                      <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md shrink-0"><Sparkles className="h-4 w-4" /></div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 capitalize mb-0.5">{insight.category}</p>
                      <p className="text-slate-600 leading-relaxed">{insight.insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations Card */}
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 rounded-xl overflow-hidden group">
          <CardHeader className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-b border-gray-100 flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-800">Actionable Recommendations</CardTitle>
            </div>
            <Badge variant={isRecommendationsEnabled ? "default" : "secondary"} className={isRecommendationsEnabled ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
              {isRecommendationsEnabled ? "Online" : "Offline"}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {recommendations.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <ShieldCheck className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Everything looks optimal.</p>
                <p className="text-xs text-slate-400 mt-1">Recommendations will be generated if issues arise.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recommendations.map(rec => (
                  <div key={rec.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2 text-sm">
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-medium text-slate-800 leading-relaxed">{rec.recommendation}</span>
                      <Badge variant={rec.priority === 'high' || rec.priority === 'critical' ? 'destructive' : 'secondary'} className="shrink-0 shadow-sm">
                        {rec.priority}
                      </Badge>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category: {rec.category}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Settings Grid */}
      <Card className="border-0 shadow-md rounded-xl overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg font-semibold text-slate-800">Configuration Status</CardTitle>
          </div>
          <CardDescription>Current operational parameters for the AI Engine</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-purple-200 transition-colors">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider block mb-1">Active Model</span>
              <span className="font-bold text-slate-800 text-base">{modelName}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-green-200 transition-colors">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider block mb-1">Daily Safety Cap</span>
              <span className="font-bold text-emerald-600 text-base">${(dailyCostLimit / 100).toFixed(2)}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider block mb-2">Summarization</span>
              <Badge variant={isSummarizationEnabled ? "default" : "secondary"} className={isSummarizationEnabled ? "bg-slate-800" : ""}>
                {isSummarizationEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
              <span className="text-slate-500 font-medium text-xs uppercase tracking-wider block mb-2">Data Processing</span>
              <Badge variant={isEnabled ? "default" : "secondary"} className={isEnabled ? "bg-slate-800" : ""}>
                {isEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
