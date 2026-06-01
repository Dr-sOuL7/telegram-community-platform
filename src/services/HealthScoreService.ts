import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { HealthSnapshotRepository } from '../repositories/HealthSnapshotRepository';
import { logger } from '../logger/pino';

export class HealthScoreService {
  constructor(
    private analyticsRepo: AnalyticsRepository,
    private healthRepo: HealthSnapshotRepository
  ) {}

  async calculateAndStoreHealth(groupId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const metrics = await this.analyticsRepo.getGroupMetrics(groupId);
    const daily = await this.analyticsRepo.getDailyMetrics(groupId, thirtyDaysAgo, new Date());

    if (!metrics || daily.length === 0) {
      return; // Not enough data
    }

    // 1. Engagement Score (0-30)
    // Based on active days and average messages
    const activeDays = daily.filter(d => d.messages > 0).length;
    const engagementScore = Math.min(30, (activeDays / 30) * 15 + Math.min(15, (metrics.averageMessagesPerDay / 100) * 15));

    // 2. Activity Score (0-20)
    // Based on active users
    const recentActiveUsers = daily[daily.length - 1]?.activeUsers || 0;
    const activityScore = Math.min(20, (recentActiveUsers / 50) * 20);

    // 3. Retention Score (0-20)
    // Based on joins vs leaves
    const retentionScore = Math.min(20, Math.max(0, 10 + (metrics.newMembers - metrics.leftMembers)));

    // 4. Moderation & Spam Risk (0-30)
    // Starts at 30, goes down based on spam and moderation actions
    const spamPenalty = metrics.spamEvents * 5;
    const modPenalty = (metrics.warningsIssued * 1) + (metrics.mutesIssued * 3) + (metrics.bansIssued * 10);
    const moderationScore = Math.max(0, 15 - modPenalty);
    const spamRiskScore = Math.max(0, 15 - spamPenalty);

    const totalScore = Math.round(engagementScore + activityScore + retentionScore + moderationScore + spamRiskScore);

    await this.healthRepo.saveSnapshot({
      groupId,
      score: totalScore,
      engagementScore,
      moderationScore,
      spamRiskScore,
      retentionScore,
      activityScore
    });

    logger.info({ groupId, score: totalScore }, 'Calculated group health score');
  }

  async getLatestScore(groupId: string) {
    return this.healthRepo.getLatestSnapshot(groupId);
  }
}
