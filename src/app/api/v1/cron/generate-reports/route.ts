import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../../config/env';
import { reportService } from '../../../../../services/container';
import { prisma } from '../../../../../db/prisma';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groups = await prisma.group.findMany({ select: { id: true } });
    for (const group of groups) {
      await reportService.generateReport(group.id, 'DAILY');
      
      // On Sundays, generate weekly report
      const now = new Date();
      if (now.getDay() === 0) {
        await reportService.generateReport(group.id, 'WEEKLY');
      }
      
      // On the 1st of the month, generate monthly report
      if (now.getDate() === 1) {
        await reportService.generateReport(group.id, 'MONTHLY');
      }
    }
    return NextResponse.json({ success: true, groupsProcessed: groups.length });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
