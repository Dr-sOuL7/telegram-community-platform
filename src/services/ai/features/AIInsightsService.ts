import { AIOrchestrator } from "../AIOrchestrator";
import { CommunityInsightRepository } from "../../../repositories/CommunityInsightRepository";
import { ContextBuilder } from "../ContextBuilder";
import { PromptManager } from "../PromptManager";

export class AIInsightsService {
  constructor(
    private orchestrator: AIOrchestrator,
    private insightRepo: CommunityInsightRepository,
    private contextBuilder: ContextBuilder
  ) {}

  async generateInsights(groupId: string): Promise<void> {
    const analyticsContext = await this.contextBuilder.buildAnalyticsContext(groupId, 7);
    const groupContext = await this.contextBuilder.buildGroupContext(groupId);

    const request = {
      messages: [
        { role: "system" as const, content: PromptManager.getInsightsSystemPrompt() },
        { role: "user" as const, content: `Analyze this group data:\n\nGroup Status:\n${groupContext}\n\n7-Day Trends:\n${analyticsContext}` }
      ],
      temperature: 0.5,
    };

    const response = await this.orchestrator.execute("insights", "FEATURE_AI_INSIGHTS", groupId, request);

    try {
      const cleanJson = response.content.replace(/```json\n?|\n?```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (Array.isArray(parsed)) {
        await this.insightRepo.saveInsights(
          parsed.map(p => ({
            groupId,
            category: p.category || "activity",
            insight: p.insight || "No details",
            confidence: p.confidence || 0.5,
            severity: p.severity || "info",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to parse AI Insights JSON:", error);
    }
  }
}
