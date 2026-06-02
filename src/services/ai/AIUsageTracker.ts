import { AIUsageRepository } from "../../repositories/AIUsageRepository";
import { AICompletionResponse } from "./providers/AIProvider";
import { TokenManager } from "./TokenManager";

export class AIUsageTracker {
  constructor(private usageRepo: AIUsageRepository) {}

  async track(
    groupId: string | undefined,
    feature: string,
    response: AICompletionResponse,
    tokenManager: TokenManager
  ): Promise<void> {
    const estimatedCost = tokenManager.calculateCostCents(
      response.model,
      response.promptTokens,
      response.completionTokens
    );

    await this.usageRepo.logUsage({
      groupId,
      feature,
      model: response.model,
      promptTokens: response.promptTokens,
      completionTokens: response.completionTokens,
      totalTokens: response.totalTokens,
      estimatedCost,
      latencyMs: response.latencyMs,
      success: true,
    });
  }

  async trackError(
    groupId: string | undefined,
    feature: string,
    model: string,
    errorMessage: string
  ): Promise<void> {
    await this.usageRepo.logUsage({
      groupId,
      feature,
      model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
      latencyMs: 0,
      success: false,
      errorMessage,
    });
  }
}
