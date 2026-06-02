import { AIOrchestrator } from "../AIOrchestrator";
import { HealthSnapshotRepository } from "../../../repositories/HealthSnapshotRepository";
import { PromptManager } from "../PromptManager";

export class HealthExplanationService {
  constructor(
    private orchestrator: AIOrchestrator,
    private healthRepo: HealthSnapshotRepository
  ) {}

  async explainHealthScore(groupId: string): Promise<string> {
    const latestSnapshot = await this.healthRepo.getLatestSnapshot(groupId);
    if (!latestSnapshot) {
      return "No health score data available for this group yet.";
    }

    const groupContext = await this.orchestrator.contextBuilder.buildGroupContext(groupId);

    const request = {
      messages: [
        { role: "system" as const, content: PromptManager.getHealthExplanationSystemPrompt(latestSnapshot.score) },
        { role: "user" as const, content: `Provide a plain text explanation for the current health score based on these metrics:\n\n${groupContext}` }
      ],
      temperature: 0.4,
    };

    const response = await this.orchestrator.execute("health_explanation", "FEATURE_AI_INSIGHTS", groupId, request);
    
    return response.content;
  }
}
