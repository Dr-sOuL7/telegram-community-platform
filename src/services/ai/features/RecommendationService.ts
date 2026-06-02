import { AIOrchestrator } from "../AIOrchestrator";
import { RecommendationRepository } from "../../../repositories/RecommendationRepository";
import { ContextBuilder } from "../ContextBuilder";
import { PromptManager } from "../PromptManager";

export class RecommendationService {
  constructor(
    private orchestrator: AIOrchestrator,
    private recommendationRepo: RecommendationRepository,
    private contextBuilder: ContextBuilder
  ) {}

  async generateRecommendations(groupId: string): Promise<void> {
    const groupContext = await this.contextBuilder.buildGroupContext(groupId);

    const request = {
      messages: [
        { role: "system" as const, content: PromptManager.getRecommendationsSystemPrompt() },
        { role: "user" as const, content: `Generate recommendations for this community based on its current status:\n\n${groupContext}` }
      ],
      temperature: 0.6,
    };

    const response = await this.orchestrator.execute("recommendations", "FEATURE_AI_RECOMMENDATIONS", groupId, request);

    try {
      const cleanJson = response.content.replace(/```json\n?|\n?```/gi, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      if (Array.isArray(parsed)) {
        await this.recommendationRepo.saveRecommendations(
          parsed.map(p => ({
            groupId,
            category: p.category || "general",
            recommendation: p.recommendation || "No details",
            confidence: p.confidence || 0.5,
            priority: p.priority || "medium",
          }))
        );
      }
    } catch (error) {
      console.error("Failed to parse AI Recommendations JSON:", error);
    }
  }
}
