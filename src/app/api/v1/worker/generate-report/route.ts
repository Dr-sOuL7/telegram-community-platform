import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/dist/nextjs';
import { logger } from '../../../../../lib/logger/pino';
import { reportService } from '../../../../../services/container';

async function handler(req: NextRequest) {
  try {
    const { groupId, reportType }: { groupId: string; reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' } = await req.json();

    if (!groupId || !reportType) {
      return NextResponse.json({ error: 'groupId and reportType are required' }, { status: 400 });
    }

    logger.info({ groupId, reportType }, 'Generating report in worker');

    await reportService.generateReport(groupId, reportType);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error({ err: error }, 'Error generating report in worker');
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const POST = verifySignatureAppRouter(handler);
