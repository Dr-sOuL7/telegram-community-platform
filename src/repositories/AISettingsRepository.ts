import { prisma } from "../db/prisma";
import { AISettings } from "@prisma/client";

export class AISettingsRepository {
  async getGlobalSettings(): Promise<AISettings | null> {
    return prisma.aISettings.findFirst({
      where: { groupId: null },
    });
  }

  async getGroupSettings(groupId: string): Promise<AISettings | null> {
    return prisma.aISettings.findUnique({
      where: { groupId },
    });
  }

  async getEffectiveSettings(groupId: string): Promise<AISettings | null> {
    const groupSettings = await this.getGroupSettings(groupId);
    if (groupSettings && groupSettings.enabled) return groupSettings;

    return this.getGlobalSettings();
  }

  async upsertSettings(data: Partial<AISettings> & { groupId?: string }): Promise<AISettings> {
    if (data.groupId) {
      return prisma.aISettings.upsert({
        where: { groupId: data.groupId },
        update: data,
        create: {
          groupId: data.groupId,
          provider: data.provider || "openai",
          model: data.model || "gpt-4o-mini",
          enabled: data.enabled ?? false,
          maxTokens: data.maxTokens ?? 2048,
          temperature: data.temperature ?? 0.7,
          dailyCostLimitCents: data.dailyCostLimitCents ?? 100,
        },
      });
    } else {
      // Global settings
      const existing = await this.getGlobalSettings();
      if (existing) {
        return prisma.aISettings.update({
          where: { id: existing.id },
          data,
        });
      }
      return prisma.aISettings.create({
        data: {
          groupId: null,
          provider: data.provider || "openai",
          model: data.model || "gpt-4o-mini",
          enabled: data.enabled ?? false,
          maxTokens: data.maxTokens ?? 2048,
          temperature: data.temperature ?? 0.7,
          dailyCostLimitCents: data.dailyCostLimitCents ?? 100,
        },
      });
    }
  }
}
