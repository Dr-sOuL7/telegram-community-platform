import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../../config/env';
import { prisma } from '../../../../../db/prisma';
import { logger } from '../../../../../lib/logger/pino';

// Vercel Cron invokes endpoints with GET; we also accept POST. Shared handler.
async function handle(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // 1. Archive Messages older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);
    
    logger.info('Starting message archival...');
    // Archive-then-delete must be ATOMIC: if the INSERT commits but the DELETE
    // fails (or vice versa), we end up with rows archived-but-not-deleted or
    // deleted-but-not-archived. Wrapping both in a single $transaction makes it
    // all-or-nothing, so a cron retry re-runs cleanly. The INSERT runs first
    // (array transactions execute sequentially in order); ON CONFLICT keeps it
    // idempotent across retries.
    const [, deletedMessages] = await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO "MessageArchive" (
          "id", "userId", "groupId", "messageId", "replyToMessageId",
          "messageText", "isEdited", "senderType", "createdAt", "archivedAt"
        )
        SELECT
          "id", "userId", "groupId", "messageId", "replyToMessageId",
          "messageText", "isEdited", "senderType", "createdAt", NOW()
        FROM "Message"
        WHERE "createdAt" < ${ninetyDaysAgo}
        ON CONFLICT ("id") DO NOTHING;
      `,
      prisma.message.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } },
      }),
    ]);

    logger.info({ archivedCount: deletedMessages.count }, 'Completed message archival');

    // 2. Prune EventLog older than 180 days
    const oneEightyDaysAgo = new Date();
    oneEightyDaysAgo.setDate(now.getDate() - 180);
    
    const deletedEvents = await prisma.eventLog.deleteMany({
      where: { createdAt: { lt: oneEightyDaysAgo } }
    });
    
    // 3. Prune AIUsageLog older than 180 days
    const deletedAIUsage = await prisma.aIUsageLog.deleteMany({
      where: { createdAt: { lt: oneEightyDaysAgo } }
    });

    return NextResponse.json({ 
      success: true, 
      archivedMessages: deletedMessages.count,
      deletedEvents: deletedEvents.count,
      deletedAIUsage: deletedAIUsage.count
    });
  } catch (error) {
    logger.error({ err: error }, 'Error pruning data');
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
