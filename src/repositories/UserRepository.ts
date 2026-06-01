import { prisma } from '../db/prisma';
import { User } from '@prisma/client';

export class UserRepository {
  async upsert(telegramId: bigint, data: { username?: string | null; firstName: string }): Promise<User> {
    return prisma.user.upsert({
      where: { telegramId },
      update: {
        username: data.username,
        firstName: data.firstName,
      },
      create: {
        telegramId,
        username: data.username,
        firstName: data.firstName,
      },
    });
  }

  async findByTelegramId(telegramId: bigint): Promise<User | null> {
    return prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async incrementWarnings(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { warnings: { increment: 1 } },
    });
  }
}
