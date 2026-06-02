import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { logger } from '../../../../../lib/logger/pino';
import { analyticsService } from '../../../../../services/container';

async function handler(req: NextRequest) {
  try {
    const { groupId }: { groupId: string } = await req.json();

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    logger.info({ groupId }, 'Processing aggregate metrics for group');

    await analyticsService.aggregateRollingMetrics(groupId);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error({ err: error }, 'Error aggregating metrics in worker');
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
