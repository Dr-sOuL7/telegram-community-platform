import { AnalyticsRepository } from '../repositories/AnalyticsRepository';
import { ReportRepository } from '../repositories/ReportRepository';
import { HealthSnapshotRepository } from '../repositories/HealthSnapshotRepository';
import { ReportType } from '@prisma/client';
import { logger } from '../logger/pino';

export class ReportService {
  constructor(
    private analyticsRepo: AnalyticsRepository,
    private reportRepo: ReportRepository,
    private healthRepo: HealthSnapshotRepository
  ) {}

  async generateReport(groupId: string, type: ReportType): Promise<void> {
    const now = new Date();
    const startDate = new Date();
    
    if (type === 'DAILY') startDate.setDate(now.getDate() - 1);
    else if (type === 'WEEKLY') startDate.setDate(now.getDate() - 7);
    else if (type === 'MONTHLY') startDate.setDate(now.getDate() - 30);
    
    const dailyData = await this.analyticsRepo.getDailyMetrics(groupId, startDate, now);
    const health = await this.healthRepo.getLatestSnapshot(groupId);

    const aggregated = dailyData.reduce((acc, curr) => ({
      messages: acc.messages + curr.messages,
      commands: acc.commands + curr.commands,
      newMembers: acc.newMembers + curr.newMembers,
      warnings: acc.warnings + curr.warnings,
      bans: acc.bans + curr.bans,
      spamEvents: acc.spamEvents + curr.spamEvents
    }), { messages: 0, commands: 0, newMembers: 0, warnings: 0, bans: 0, spamEvents: 0 });

    const title = `${type} Community Intelligence Report`;
    const summary = `
📊 **${title}**

💬 **Engagement**
- Messages: ${aggregated.messages}
- Commands: ${aggregated.commands}
- New Members: ${aggregated.newMembers}

🛡️ **Moderation**
- Warnings: ${aggregated.warnings}
- Bans: ${aggregated.bans}
- Spam Events: ${aggregated.spamEvents}

❤️ **Health Score**: ${health?.score || 'N/A'}/100
    `.trim();

    await this.reportRepo.saveReport({
      groupId,
      reportType: type,
      title,
      summary,
      payload: aggregated,
      generatedBy: 'system'
    });

    logger.info({ groupId, reportType: type }, 'Generated community report');
  }

  async getLatestReport(groupId: string, type: ReportType) {
    return this.reportRepo.getLatestReport(groupId, type);
  }
}
