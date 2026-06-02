import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { logger } from '../../../../../lib/logger/pino';
import { UpdateRepository } from '../../../../../repositories/UpdateRepository';
import { TelegramUpdate } from '../../../../../domain/types/telegram';
import { UpdateDispatcher } from '../../../../../lib/telegram/UpdateDispatcher';

const updateRepo = new UpdateRepository();
const dispatcher = new UpdateDispatcher();

async function handler(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const update: TelegramUpdate = await req.json();

    // Idempotency Check
    const isNew = await updateRepo.markProcessed(BigInt(update.update_id));
    if (!isNew) {
      logger.info({ requestId, updateId: update.update_id }, 'Update already processed, skipping (QStash deduplication active)');
      return NextResponse.json({ ok: true });
    }

    logger.info({ requestId, updateId: update.update_id }, 'Processing Telegram update via QStash worker');

    // Dispatch update to services
    await dispatcher.dispatch(update, requestId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error({ requestId, err: error }, 'Error processing webhook payload in worker');
    // If we throw here, QStash will retry the message up to its configured max retries.
    // We want to return 500 to trigger QStash retry on transient errors.
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Wrap with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);
