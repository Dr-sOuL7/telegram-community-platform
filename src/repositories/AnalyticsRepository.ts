import { prisma } from '../db/prisma';

export class AnalyticsRepository {
  
  async logUserActivity(userId: string, groupId: string, update: {
    messageCount?: number;
    commandCount?: number;
    warningCount?: number;
    muteCount?: number;
    banCount?: number;
  }) {
    return prisma.userActivity.upsert({
      where: { userId_groupId: { userId, groupId } },
      update: {
        messageCount: { increment: update.messageCount || 0 },
        commandCount: { increment: update.commandCount || 0 },
        warningCount: { increment: update.warningCount || 0 },
        muteCount: { increment: update.muteCount || 0 },
        banCount: { increment: update.banCount || 0 },
        lastActiveAt: new Date(),
      },
      create: {
        userId,
        groupId,
        messageCount: update.messageCount || 0,
        commandCount: update.commandCount || 0,
        warningCount: update.warningCount || 0,
        muteCount: update.muteCount || 0,
        banCount: update.banCount || 0,
        activeDays: 1,
        lastActiveAt: new Date(),
      }
    });
  }

  async logGroupMetrics(groupId: string, update: {
    totalMessages?: number;
    totalCommands?: number;
    newMembers?: number;
    leftMembers?: number;
    warningsIssued?: number;
    mutesIssued?: number;
    bansIssued?: number;
    spamEvents?: number;
  }) {
    return prisma.groupMetrics.upsert({
      where: { groupId },
      update: {
        totalMessages: { increment: update.totalMessages || 0 },
        totalCommands: { increment: update.totalCommands || 0 },
        newMembers: { increment: update.newMembers || 0 },
        leftMembers: { increment: update.leftMembers || 0 },
        warningsIssued: { increment: update.warningsIssued || 0 },
        mutesIssued: { increment: update.mutesIssued || 0 },
        bansIssued: { increment: update.bansIssued || 0 },
        spamEvents: { increment: update.spamEvents || 0 },
      },
      create: {
        groupId,
        totalMessages: update.totalMessages || 0,
        totalCommands: update.totalCommands || 0,
        newMembers: update.newMembers || 0,
        leftMembers: update.leftMembers || 0,
        warningsIssued: update.warningsIssued || 0,
        mutesIssued: update.mutesIssued || 0,
        bansIssued: update.bansIssued || 0,
        spamEvents: update.spamEvents || 0,
      }
    });
  }

  async logDailyMetrics(groupId: string, date: Date, update: {
    messages?: number;
    commands?: number;
    newMembers?: number;
    leftMembers?: number;
    warnings?: number;
    mutes?: number;
    bans?: number;
    spamEvents?: number;
  }) {
    // Ensure date is midnight UTC
    const midnight = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    return prisma.dailyMetrics.upsert({
      where: { groupId_date: { groupId, date: midnight } },
      update: {
        messages: { increment: update.messages || 0 },
        commands: { increment: update.commands || 0 },
        newMembers: { increment: update.newMembers || 0 },
        leftMembers: { increment: update.leftMembers || 0 },
        warnings: { increment: update.warnings || 0 },
        mutes: { increment: update.mutes || 0 },
        bans: { increment: update.bans || 0 },
        spamEvents: { increment: update.spamEvents || 0 },
      },
      create: {
        groupId,
        date: midnight,
        messages: update.messages || 0,
        commands: update.commands || 0,
        newMembers: update.newMembers || 0,
        leftMembers: update.leftMembers || 0,
        warnings: update.warnings || 0,
        mutes: update.mutes || 0,
        bans: update.bans || 0,
        spamEvents: update.spamEvents || 0,
      }
    });
  }

  async getGroupMetrics(groupId: string) {
    return prisma.groupMetrics.findUnique({ where: { groupId } });
  }

  async getDailyMetrics(groupId: string, startDate: Date, endDate: Date) {
    return prisma.dailyMetrics.findMany({
      where: {
        groupId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });
  }
}
