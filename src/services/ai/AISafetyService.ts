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
    //
    // KNOWN LIMITATION (check-then-act): this reads *prior* spend and does not
    // reserve the cost of the request about to run, so the cap can be exceeded
    // by (a) one request's worth of cost (we can't pre-estimate tokens), and
    // (b) concurrent requests that both read "under limit" before either logs.
    // It is also per-group/global scoped — there is no platform-wide ceiling.
    // A precise fix needs an atomic counter (e.g. an Upstash Redis token-bucket
    // keyed by group+day). Tracked for follow-up; acceptable for now because AI
    // calls per group are infrequent and admin-triggered.
    const today = new Date();
    const currentCost = await this.aiUsageRepo.getDailyCostCents(today, groupId);
    if (currentCost >= effectiveSettings.dailyCostLimitCents) {
      throw new AppError(ErrorCategory.VALIDATION, `Daily AI cost limit reached. (${currentCost} / ${effectiveSettings.dailyCostLimitCents} cents)`);
    }
  }

  detectPromptInjection(input: string): boolean {
    // Length guard against context-window-overflow / massive-paste attacks.
    if (input.length > 5000) return true;

    const normalized = input.toLowerCase();

    // High-signal injection phrases, WORD-BOUNDARY anchored.
    //
    // The previous implementation used substring `includes()` on short tokens
    // like "dan", "bypass", "pretend", "roleplay", and "```". Those match inside
    // ordinary words ("abun-dan-t", "Su-dan") and appear constantly in normal
    // community chat (code blocks especially), so summarization of legitimate
    // groups was being rejected as "prompt injection". We now match only
    // canonical multi-word injection phrases, which are inherently low-false-
    // positive, via anchored regexes.
    const patterns: RegExp[] = [
      /\bignore (all |the )?(previous|above|prior)\b/,
      /\bdisregard (all |the )?(previous|above|prior)\b/,
      /\bforget (everything|what|all|the above|previous|your)\b/,
      /\byou are now\b/,
      /\bact as (an? )?(dan|jailbreak)\b/,
      /\bdo anything now\b/,
      /\bdeveloper mode\b/,
      /\b(reveal|show|print|repeat|output)\b.{0,24}\b(system|initial|original)\b.{0,12}\b(prompt|instructions?)\b/,
      /\bnew instructions?\s*:/,
      /\boverride (your|the) (instructions?|rules?|guardrails?|prompt)\b/,
    ];

    return patterns.some((re) => re.test(normalized));
  }
}
