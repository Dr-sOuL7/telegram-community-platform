import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { logger } from '../../../../../lib/logger/pino';
import { analyticsService } from '../../../../../services/container';
import { EventLog } from '@prisma/client';

async function handler(req: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
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

// Wrap with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler);
