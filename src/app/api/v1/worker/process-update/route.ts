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

    // Guard against a malformed/missing update_id. The body is QStash-signed
    // (so it originated from our own webhook), but a missing id would throw in
    // BigInt() and poison the retry loop forever. Ack and drop instead.
    if (typeof update.update_id !== 'number' || !Number.isFinite(update.update_id)) {
      logger.error({ requestId, update }, 'Dropping update with missing/invalid update_id (cannot dedupe)');
      return NextResponse.json({ ok: true, dropped: true });
    }
    const updateId = BigInt(update.update_id);

    // Idempotency: peek BEFORE doing any work so an already-handled update does
    // not re-run side effects.
    if (await updateRepo.isProcessed(updateId)) {
      logger.info({ requestId, updateId: update.update_id }, 'Update already processed, skipping');
      return NextResponse.json({ ok: true });
    }

    logger.info({ requestId, updateId: update.update_id }, 'Processing Telegram update via QStash worker');

    // Dispatch FIRST. Critical-path failures throw, so we never reach the marker
    // below and the 500 lets QStash retry. Non-critical work (event logs,
    // analytics dispatch, message sends) is swallowed inside the dispatcher.
    await dispatcher.dispatch(update, requestId);

    // Commit the idempotency marker only after successful dispatch. A false
    // return means a concurrent duplicate delivery already recorded it — still
    // a success for us.
    //
    // ACCEPTED RESIDUAL (decided, not an oversight): if this marker write fails
    // *after* a fully successful dispatch, the retry re-runs dispatch. Message
    // writes are idempotent (unique key) so they don't duplicate, but an auto-
    // moderation action could be created twice in that rare window. A full
    // interactive-transaction refactor was evaluated and rejected: it can't make
    // Telegram sends idempotent anyway, and the marginal benefit (one rare
    // duplicate row) doesn't justify the risk. See git history / project notes.
    await updateRepo.markProcessed(updateId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error({ requestId, err: error }, 'Error processing webhook payload in worker');
    // Return 500 to trigger QStash retry. The idempotency marker was NOT
    // committed, so the retry re-runs dispatch (whose critical writes are
    // idempotent) without data loss.
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
