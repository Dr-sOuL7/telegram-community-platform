import { IAIProvider, AICompletionRequest, AICompletionResponse } from "./providers/AIProvider";
import { PromptManager } from "./PromptManager";
import { ContextBuilder } from "./ContextBuilder";
import { TokenManager } from "./TokenManager";
import { AISafetyService } from "./AISafetyService";
import { AIUsageTracker } from "./AIUsageTracker";
import { AppError, ErrorCategory } from "../../lib/errors/ErrorService";

export class AIOrchestrator {
  constructor(
    private provider: IAIProvider,
    public promptManager: PromptManager,
    public contextBuilder: ContextBuilder,
    private tokenManager: TokenManager,
    public safetyService: AISafetyService,
    private usageTracker: AIUsageTracker
  ) {}

  async execute(
    feature: string,
    featureFlag: 'FEATURE_SUMMARIZATION' | 'FEATURE_AI_INSIGHTS' | 'FEATURE_AI_RECOMMENDATIONS' | 'FEATURE_AI_ASSISTANT' | 'FEATURE_AI_REPORTS',
    groupId: string | undefined,
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    
    // 1. Safety Check
    await this.safetyService.validateRequest(groupId, featureFlag);

    // Prompt injection check on user inputs
    const userInputs = request.messages.filter(m => m.role === 'user').map(m => m.content).join(" ");
    if (this.safetyService.detectPromptInjection(userInputs)) {
      throw new AppError(ErrorCategory.VALIDATION, "Prompt injection detected. Request rejected.");
    }

    try {
      // 2. Execute
      const response = await this.provider.complete(request);

      // 3. Track Usage
      await this.usageTracker.track(groupId, feature, response, this.tokenManager);

      return response;
    } catch (error: any) {
      // Track Failure
      await this.usageTracker.trackError(groupId, feature, request.model || "unknown", error.message);
      
      // Graceful degradation: Instead of crashing the parent process (e.g. analytics generation),
      // we log the error and return a fallback response. This prevents a temporary 429 Rate Limit
      // from breaking the entire application.
      return {
        model: request.model || "unknown",
        content: "AI service is currently unavailable or rate limited. Please try again later.",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs: 0
      };
    }
  }
}
