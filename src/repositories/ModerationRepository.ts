import { prisma } from '../db/prisma';
import { ModerationAction, ModerationActionType, Prisma } from '@prisma/client';

export class ModerationRepository {
  async createAction(data: {
    userId: string;
    groupId: string;
    moderatorId: string;
    actionType: ModerationActionType;
    reason?: string;
  }): Promise<ModerationAction> {
    return prisma.moderationAction.create({
      data: {
        userId: data.userId,
        groupId: data.groupId,
        moderatorId: data.moderatorId,
        actionType: data.actionType,
        reason: data.reason,
      },
    });
  }
}
