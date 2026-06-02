import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../../config/env';
import { prisma } from '../../../../../db/prisma';
import { qstashClient } from '../../../../../lib/qstash';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch all active groups
    const groups = await prisma.group.findMany({ select: { id: true } });
    
    if (groups.length === 0) {
      return NextResponse.json({ success: true, groupsProcessed: 0 });
    }

    // 2. Fan-out: Push a QStash message for each group
    const messages = groups.map((g) => ({
      url: `${env.APP_URL}/api/v1/worker/aggregate-group`,
      body: { groupId: g.id },
    }));

    // QStash allows publishing up to 1000 messages in a single batch array, but for safety we'll use publishJSON iteratively
    // Actually publishJSON accepts a single message. QStash client has publishBatch but let's just loop-publish for simplicity
    // with Promise.all in chunks if needed. For Next.js, sending many small requests is fine.
    
    // Batch in chunks of 50 to avoid hammering Upstash API limits instantly
    const chunkSize = 50;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(msg => qstashClient.publishJSON(msg))
      );
    }

    return NextResponse.json({ success: true, groupsEnqueued: groups.length });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) || 'Internal Server Error' }, { status: 500 });
  }
}
