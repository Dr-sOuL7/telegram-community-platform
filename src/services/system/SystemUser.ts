import { prisma } from '../../db/prisma';
import { logger } from '../../lib/logger/pino';

/**
 * The SYSTEM user's telegramId is 0 (impossible for real Telegram users).
 * This user is created by `prisma/seed.ts` and is used as the moderatorId
 * for all automated moderation actions (spam, auto-mute, auto-ban).
 */
const SYSTEM_TELEGRAM_ID = BigInt(0);

let _systemUserId: string | null = null;

/**
 * Returns the internal UUID of the SYSTEM user, lazily resolved on first call.
 * If the SYSTEM user doesn't exist yet (seed hasn't run), it creates one.
 */
export async function getSystemUserId(): Promise<string> {
  if (_systemUserId) return _systemUserId;

  try {
    const user = await prisma.user.upsert({
      where: { telegramId: SYSTEM_TELEGRAM_ID },
      update: {},
      create: {
        telegramId: SYSTEM_TELEGRAM_ID,
        firstName: 'SYSTEM',
        username: 'sentinel_system',
        reputation: 0,
        isActive: true,
      },
    });
    _systemUserId = user.id;
    return _systemUserId;
  } catch (err) {
    logger.error({ err }, 'Failed to resolve SYSTEM user');
    throw err;
  }
}
