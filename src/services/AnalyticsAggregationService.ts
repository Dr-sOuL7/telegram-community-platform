import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { EventLog, EventType } from '@prisma/client';
import { prisma } from '../db/prisma';
import { logger } from '../lib/logger/pino';

export class AnalyticsAggregationService {
  constructor(private analyticsRepo: AnalyticsRepository) {}

  /**
   * Processes a single event in real-time and updates aggregates immediately.
   * This is part of the data flow requirement.
   */
  async processEvent(event: EventLog): Promise<void> {
    if (!event.groupId || !event.userId) return; // We only aggregate group events tied to users
    
    const { groupId, userId, eventType } = event;
    const now = new Date();

    const groupUpdate: any = {};
    const userUpdate: any = {};
    const dailyUpdate: any = {};

    switch (eventType) {
      case EventType.MESSAGE_SENT:
        groupUpdate.totalMessages = 1;
        userUpdate.messageCount = 1;
        dailyUpdate.messages = 1;
        break;
      case EventType.COMMAND_EXECUTED:
        groupUpdate.totalCommands = 1;
        userUpdate.commandCount = 1;
        dailyUpdate.commands = 1;
        break;
      case EventType.USER_JOINED:
        groupUpdate.newMembers = 1;
        dailyUpdate.newMembers = 1;
        break;
      case EventType.USER_LEFT:
        groupUpdate.leftMembers = 1;
        dailyUpdate.leftMembers = 1;
        break;
      case EventType.WARNING_CREATED:
        groupUpdate.warningsIssued = 1;
        userUpdate.warningCount = 1;
        dailyUpdate.warnings = 1;
        break;
      case EventType.MUTE_APPLIED:
        groupUpdate.mutesIssued = 1;
        userUpdate.muteCount = 1;
        dailyUpdate.mutes = 1;
        break;
      case EventType.BAN_APPLIED:
        groupUpdate.bansIssued = 1;
        userUpdate.banCount = 1;
        dailyUpdate.bans = 1;
        break;
      case EventType.SPAM_DETECTED:
        groupUpdate.spamEvents = 1;
        dailyUpdate.spamEvents = 1;
        break;
      default:
        return; // Nothing to aggregate
    }

    try {
      // We run these in parallel
      await Promise.all([
        this.analyticsRepo.logUserActivity(userId, groupId, userUpdate),
        this.analyticsRepo.logGroupMetrics(groupId, groupUpdate),
        this.analyticsRepo.logDailyMetrics(groupId, now, dailyUpdate)
      ]);
    } catch (error) {
      logger.error({ error, eventId: event.id }, 'Failed to process event for analytics');
    }
  }

  /**
   * Cron job entrypoint: Computes peak hours/days for a group.
   * Scans the last 30 days of messages.
   */
  async aggregateRollingMetrics(groupId: string): Promise<void> {
    // In a real production system, this would do a heavy GROUP BY query.
    // For Phase 2, we update the `averageMessagesPerDay` on GroupMetrics based on DailyMetrics.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await this.analyticsRepo.getDailyMetrics(groupId, thirtyDaysAgo, new Date());
    if (metrics.length === 0) return;

    const totalMessages = metrics.reduce((sum, m) => sum + m.messages, 0);
    const averageMessagesPerDay = totalMessages / metrics.length;

    await prisma.groupMetrics.update({
      where: { groupId },
      data: { averageMessagesPerDay }
    });
    
    logger.info({ groupId, averageMessagesPerDay }, 'Rolling metrics aggregated');
  }
}
