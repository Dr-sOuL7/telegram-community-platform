import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../../config/env';
import { prisma } from '../../../../../db/prisma';
import { getQStashClient } from '../../../../../lib/qstash';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groups = await prisma.group.findMany({ select: { id: true } });
    if (groups.length === 0) {
      return NextResponse.json({ success: true, groupsProcessed: 0 });
    }
    
    const now = new Date();
    const isWeekly = now.getDay() === 0;
    const isMonthly = now.getDate() === 1;

    // Create an array of tasks for each group
    const qstash = getQStashClient();
    const tasks = groups.flatMap(group => {
      const groupTasks = [{ url: `${env.APP_URL}/api/v1/worker/generate-report`, body: { groupId: group.id, reportType: 'DAILY' } }];
      if (isWeekly) groupTasks.push({ url: `${env.APP_URL}/api/v1/worker/generate-report`, body: { groupId: group.id, reportType: 'WEEKLY' } });
      if (isMonthly) groupTasks.push({ url: `${env.APP_URL}/api/v1/worker/generate-report`, body: { groupId: group.id, reportType: 'MONTHLY' } });
      return groupTasks;
    });

    const chunkSize = 50;
    for (let i = 0; i < tasks.length; i += chunkSize) {
      const chunk = tasks.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(msg => qstash.publishJSON(msg))
      );
    }

    return NextResponse.json({ success: true, reportsEnqueued: tasks.length });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) || 'Internal Server Error' }, { status: 500 });
  }
}
