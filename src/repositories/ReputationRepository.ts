import { prisma } from '../db/prisma';
import { ReputationHistory, User } from '@prisma/client';

export class ReputationRepository {
  async addHistory(data: {
    userId: string;
    groupId: string;
    delta: number;
    reason?: string;
    sourceType: string;
    sourceId?: string;
  }): Promise<ReputationHistory> {
    return prisma.reputationHistory.create({
      data,
    });
  }

  async updateUserReputation(
    userId: string,
    delta: number,
    newLevel: string | null
  ): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        reputation: { increment: delta },
        reputationLevel: newLevel,
        lastReputationChangeAt: new Date(),
      },
    });
  }

  async getTopUsers(groupId: string, limit: number = 10) {
    // Top users by reputation who are active in this group
    return prisma.user.findMany({
      where: {
        groupRoles: { some: { groupId } },
      },
      orderBy: { reputation: 'desc' },
      take: limit,
      select: {
        id: true,
        firstName: true,
        username: true,
        reputation: true,
        reputationLevel: true,
      }
    });
  }
}
