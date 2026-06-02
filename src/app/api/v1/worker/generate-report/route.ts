import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../../../../lib/logger/pino';
import { reportService } from '../../../../../services/container';
import { verifyQStashSignature } from '../../../../../lib/qstash';

export async function POST(req: NextRequest) {
  try {
    const isValid = await verifyQStashSignature(req);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 });
    }

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
