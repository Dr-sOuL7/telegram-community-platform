import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../../lib/logger/pino';
import { UpdateRepository } from '../../../../../repositories/UpdateRepository';
import { TelegramUpdate } from '../../../../../domain/types/telegram';
import { UpdateDispatcher } from '../../../../../lib/telegram/UpdateDispatcher';
import { verifyQStashSignature } from '../../../../../lib/qstash';

const updateRepo = new UpdateRepository();
const dispatcher = new UpdateDispatcher();

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const isValid = await verifyQStashSignature(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 });
    }

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
    // Return 500 to trigger QStash retry on transient errors.
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
