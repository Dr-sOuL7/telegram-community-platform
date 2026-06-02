import { AnalyticsRepository } from "../../repositories/AnalyticsRepository";
import { HealthSnapshotRepository } from "../../repositories/HealthSnapshotRepository";
import { ReportRepository } from "../../repositories/ReportRepository";
import { prisma } from "../../db/prisma";

export class ContextBuilder {
  constructor(
    private analyticsRepo: AnalyticsRepository,
    private healthRepo: HealthSnapshotRepository,
    private reportRepo: ReportRepository
  ) {}

  async buildMessageContext(groupId: string, timeRangeStart: Date, timeRangeEnd: Date, limit: number = 100): Promise<string> {
    const messages = await prisma.message.findMany({
      where: {
        groupId,
        createdAt: {
          gte: timeRangeStart,
          lte: timeRangeEnd,
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: { user: { select: { username: true, firstName: true } } },
    });

    if (messages.length === 0) return "No messages found in this time range.";

    return messages
      .map(m => `[${m.createdAt.toISOString()}] ${m.user.username || m.user.firstName}: ${m.messageText}`)
      .join("\n");
  }

  async buildGroupContext(groupId: string): Promise<string> {
    const stats = await this.analyticsRepo.getGroupMetrics(groupId);
    const health = await this.healthRepo.getLatestSnapshot(groupId);
    
    return JSON.stringify({
      metrics: stats,
      healthScore: health?.score,
      engagementScore: health?.engagementScore,
      spamRiskScore: health?.spamRiskScore,
      moderationScore: health?.moderationScore,
    }, null, 2);
  }

  async buildUserContext(groupId: string, userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { userActivities: { where: { groupId } } }
    });
    
    if (!user) return "User not found.";
    
    const activity = user.userActivities[0];
    
    return JSON.stringify({
      username: user.username,
      firstName: user.firstName,
      reputation: user.reputation,
      reputationLevel: user.reputationLevel,
      warnings: user.warnings,
      activity: activity ? {
        messageCount: activity.messageCount,
        commandCount: activity.commandCount,
        warningCount: activity.warningCount,
        muteCount: activity.muteCount,
        banCount: activity.banCount,
      } : null
    }, null, 2);
  }

  async buildAnalyticsContext(groupId: string, days: number = 7): Promise<string> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const dailyMetrics = await this.analyticsRepo.getDailyMetrics(groupId, startDate, endDate);
    
    return JSON.stringify(dailyMetrics, null, 2);
  }
}
