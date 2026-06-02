import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../config/env';
import { logger } from '../../../../lib/logger/pino';
import { TelegramUpdate } from '../../../../domain/types/telegram';
import { qstashClient } from '../../../../lib/qstash';

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

    // Push the payload to QStash to be processed asynchronously by our worker.
    // We use the Telegram update_id as the deduplication ID so QStash guarantees exactly-once delivery.
    await qstashClient.publishJSON({
      url: `${env.APP_URL}/api/v1/worker/process-update`,
      body: update,
      deduplicationId: `tg-update-${update.update_id}`,
    });

    logger.info({ requestId, updateId: update.update_id }, 'Pushed Telegram update to QStash queue');

    // Immediately acknowledge receipt to Telegram to prevent timeouts
    return NextResponse.json({ ok: true }, { headers: { 'X-Request-ID': requestId, 'X-App-Version': '1.0.0' } });
  } catch (error: any) {
    logger.error({ requestId, err: error }, 'Error publishing webhook payload to QStash');
    // We return 500 on internal push failures so Telegram applies exponential backoff and retries.
    // This prevents silent data loss during a QStash outage.
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500, headers: { 'X-Request-ID': requestId, 'X-App-Version': '1.0.0' } });
  }
}
