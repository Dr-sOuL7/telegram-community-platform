import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../../lib/logger/pino';
import { analyticsService } from '../../../../../services/container';
import { verifyQStashSignature } from '../../../../../lib/qstash';
import { EventLog } from '@prisma/client';

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const isValid = await verifyQStashSignature(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 });
    }

    const event: EventLog = await req.json();

    logger.info({ requestId, eventId: event.id, eventType: event.eventType }, 'Processing event via QStash worker');

    // Run synchronous analytics processing in background worker
    await analyticsService.processEvent(event);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error({ requestId, err: error }, 'Error processing event payload in worker');
    // Return 500 so QStash retries
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
