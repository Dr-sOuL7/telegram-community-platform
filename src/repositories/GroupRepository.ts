import { prisma } from '../db/prisma';
import { Group, GroupSettings } from '@prisma/client';

export class GroupRepository {
  async upsert(telegramGroupId: bigint, groupName: string): Promise<Group> {
    return prisma.group.upsert({
      where: { telegramGroupId },
      update: { groupName },
      create: {
        telegramGroupId,
        groupName,
        settings: {
          create: {}, // Use defaults
        },
      },
      include: {
        settings: true,
      },
    });
  }

  async findByTelegramId(telegramGroupId: bigint): Promise<(Group & { settings: GroupSettings | null }) | null> {
    return prisma.group.findUnique({
      where: { telegramGroupId },
      include: { settings: true },
    });
  }
}
