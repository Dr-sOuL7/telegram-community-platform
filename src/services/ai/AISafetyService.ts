import { AISettingsRepository } from "../../repositories/AISettingsRepository";
import { AIUsageRepository } from "../../repositories/AIUsageRepository";
import { env } from "../../config/env";
import { AppError, ErrorCategory } from "../../lib/errors/ErrorService";

export class AISafetyService {
  constructor(
    private aiSettingsRepo: AISettingsRepository,
    private aiUsageRepo: AIUsageRepository
  ) {}

  async validateRequest(groupId: string | undefined, featureFlag: 'FEATURE_SUMMARIZATION' | 'FEATURE_AI_INSIGHTS' | 'FEATURE_AI_RECOMMENDATIONS' | 'FEATURE_AI_ASSISTANT' | 'FEATURE_AI_REPORTS'): Promise<void> {
    // 1. Check Master Switch
    if (!env.FEATURE_AI) {
      throw new AppError(ErrorCategory.VALIDATION, "AI features are globally disabled.");
    }

    // 2. Check Feature Switch
    if (!env[featureFlag]) {
      throw new AppError(ErrorCategory.VALIDATION, `Feature ${featureFlag} is disabled in environment.`);
    }

    // 3. Check Settings overrides
    const settings = groupId ? await this.aiSettingsRepo.getEffectiveSettings(groupId) : await this.aiSettingsRepo.getGlobalSettings();
    if (!settings || !settings.enabled) {
      throw new AppError(ErrorCategory.VALIDATION, "AI is disabled in group/global settings.");
    }

    switch(featureFlag) {
      case 'FEATURE_SUMMARIZATION': if (!settings.summarizationEnabled) throw new AppError(ErrorCategory.VALIDATION, "Summarization disabled."); break;
      case 'FEATURE_AI_INSIGHTS': if (!settings.insightsEnabled) throw new AppError(ErrorCategory.VALIDATION, "Insights disabled."); break;
      case 'FEATURE_AI_RECOMMENDATIONS': if (!settings.recommendationEnabled) throw new AppError(ErrorCategory.VALIDATION, "Recommendations disabled."); break;
    }

    // 4. Check Cost Ceilings
    const today = new Date();
    const currentCost = await this.aiUsageRepo.getDailyCostCents(today, groupId);
    if (currentCost >= settings.dailyCostLimitCents) {
      throw new AppError(ErrorCategory.VALIDATION, `Daily AI cost limit reached. (${currentCost} / ${settings.dailyCostLimitCents} cents)`);
    }
  }

  detectPromptInjection(input: string): boolean {
    const lower = input.toLowerCase();
    const patterns = [
      "ignore all previous instructions",
      "ignore previous instructions",
      "disregard previous",
      "you are now",
      "forget what i told you",
      "system prompt",
      "bypass",
    ];

    return patterns.some(p => lower.includes(p));
  }
}
