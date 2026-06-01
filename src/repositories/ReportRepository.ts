import { prisma } from '../db/prisma';
import { ReportType, Prisma } from '@prisma/client';

export class ReportRepository {
  async saveReport(data: {
    groupId: string;
    reportType: ReportType;
    title: string;
    summary: string;
    payload: Prisma.InputJsonValue;
    generatedBy: string;
  }) {
    return prisma.report.create({ data });
  }

  async getLatestReport(groupId: string, reportType: ReportType) {
    return prisma.report.findFirst({
      where: { groupId, reportType },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  async getReports(groupId: string, limit: number = 10) {
    return prisma.report.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
