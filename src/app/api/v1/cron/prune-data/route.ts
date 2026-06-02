import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../../config/env';
import { prisma } from '../../../../../db/prisma';
import { logger } from '../../../../../lib/logger/pino';

export async function POST(req: NextRequest) {
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
    // In Prisma, moving rows between tables at scale requires raw SQL or batch processing.
    // For safety in serverless, we do it in a transaction or raw query.
    // INSERT INTO MessageArchive SELECT ... FROM Message WHERE createdAt < ninetyDaysAgo
    // DELETE FROM Message WHERE createdAt < ninetyDaysAgo
    
    await prisma.$executeRaw`
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
    `;
    
    const deletedMessages = await prisma.message.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } }
    });
    
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
  } catch (error: any) {
    logger.error({ err: error }, 'Error pruning data');
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
