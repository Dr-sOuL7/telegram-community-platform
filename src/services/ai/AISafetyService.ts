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

    // 3. Check Settings overrides (fallback to env defaults if not set)
    const dbSettings = groupId ? await this.aiSettingsRepo.getEffectiveSettings(groupId) : await this.aiSettingsRepo.getGlobalSettings();
    
    const effectiveSettings = dbSettings || {
      enabled: env.FEATURE_AI,
      summarizationEnabled: env.FEATURE_SUMMARIZATION,
      insightsEnabled: env.FEATURE_AI_INSIGHTS,
      recommendationEnabled: env.FEATURE_AI_RECOMMENDATIONS,
      dailyCostLimitCents: 100
    };

    if (!effectiveSettings.enabled) {
      throw new AppError(ErrorCategory.VALIDATION, "AI is disabled in group/global settings.");
    }

    switch(featureFlag) {
      case 'FEATURE_SUMMARIZATION': if (!effectiveSettings.summarizationEnabled) throw new AppError(ErrorCategory.VALIDATION, "Summarization disabled."); break;
      case 'FEATURE_AI_INSIGHTS': if (!effectiveSettings.insightsEnabled) throw new AppError(ErrorCategory.VALIDATION, "Insights disabled."); break;
      case 'FEATURE_AI_RECOMMENDATIONS': if (!effectiveSettings.recommendationEnabled) throw new AppError(ErrorCategory.VALIDATION, "Recommendations disabled."); break;
    }

    // 4. Check Cost Ceilings
    const today = new Date();
    const currentCost = await this.aiUsageRepo.getDailyCostCents(today, groupId);
    if (currentCost >= effectiveSettings.dailyCostLimitCents) {
      throw new AppError(ErrorCategory.VALIDATION, `Daily AI cost limit reached. (${currentCost} / ${effectiveSettings.dailyCostLimitCents} cents)`);
    }
  }

  detectPromptInjection(input: string): boolean {
    const lower = input.toLowerCase();
    
    // Level 2 Validation: Check for common injection patterns and bypass techniques
    const patterns = [
      "ignore all previous",
      "disregard previous",
      "you are now",
      "forget what",
      "system prompt",
      "bypass",
      "dan",
      "do anything now",
      "ignore the above",
      "developer mode",
      "from now on",
      "roleplay",
      "pretend",
      "base64",
      "```",
    ];

    // High heuristic match
    const containsPattern = patterns.some(p => lower.includes(p));
    
    // Entropy / length check to prevent massive copy-paste attacks targeting context window overflow
    // although ContextBuilder limits length, the user prompt length should also be bounded
    const isSuspiciouslyLong = input.length > 5000;

    return containsPattern || isSuspiciouslyLong;
  }
}
