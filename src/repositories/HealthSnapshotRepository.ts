import { prisma } from '../db/prisma';

export class HealthSnapshotRepository {
  async saveSnapshot(data: {
    groupId: string;
    score: number;
    engagementScore: number;
    moderationScore: number;
    spamRiskScore: number;
    retentionScore: number;
    activityScore: number;
  }) {
    return prisma.groupHealthSnapshot.create({
      data,
    });
  }

  async getLatestSnapshot(groupId: string) {
    return prisma.groupHealthSnapshot.findFirst({
      where: { groupId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSnapshots(groupId: string, limit: number = 30) {
    return prisma.groupHealthSnapshot.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
