import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../config/env';
import { logger } from '../../../../lib/logger/pino';
import { UpdateRepository } from '../../../../repositories/UpdateRepository';
import { TelegramUpdate } from '../../../../domain/types/telegram';
import { UpdateDispatcher } from '../../../../lib/telegram/UpdateDispatcher';

const updateRepo = new UpdateRepository();
const dispatcher = new UpdateDispatcher();

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const secret = req.headers.get('x-telegram-bot-api-secret-token');

  // Verify Telegram secret token
  if (secret !== env.WEBHOOK_SECRET) {
    logger.warn({ requestId }, 'Unauthorized webhook access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update: TelegramUpdate = await req.json();

    // Idempotency Check
    const isNew = await updateRepo.markProcessed(BigInt(update.update_id));
    if (!isNew) {
      logger.info({ requestId, updateId: update.update_id }, 'Update already processed, skipping');
      return NextResponse.json({ ok: true }, { headers: { 'X-Request-ID': requestId, 'X-App-Version': '1.0.0' } });
    }

    logger.info({ requestId, updateId: update.update_id }, 'Processing new Telegram update');

    // Dispatch update to services
    await dispatcher.dispatch(update, requestId);

    return NextResponse.json({ ok: true }, { headers: { 'X-Request-ID': requestId, 'X-App-Version': '1.0.0' } });
  } catch (error: any) {
    logger.error({ requestId, err: error }, 'Error processing webhook payload');
    // We return 200 even on error to prevent Telegram from infinitely retrying bad payloads
    return NextResponse.json({ ok: true }, { headers: { 'X-Request-ID': requestId, 'X-App-Version': '1.0.0' } });
  }
}
