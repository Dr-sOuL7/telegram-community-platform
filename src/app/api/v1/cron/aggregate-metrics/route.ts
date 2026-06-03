import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../../config/env';
import { prisma } from '../../../../../db/prisma';
import { getQStashClient } from '../../../../../lib/qstash';

// Vercel Cron invokes endpoints with GET; we also accept POST for manual/QStash
// triggers. Both share one handler.
async function handle(req: NextRequest) {
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
    const qstash = getQStashClient();
    const messages = groups.map((g) => ({
      url: `${env.APP_URL}/api/v1/worker/aggregate-group`,
      body: { groupId: g.id },
    }));

    // Batch in chunks of 50 to avoid hammering Upstash API limits instantly
    const chunkSize = 50;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(msg => qstash.publishJSON(msg))
      );
    }

    // ── Hobby-plan cron orchestration ──────────────────────────────
    // Vercel Hobby allows only 2 cron jobs (daily). This cron and
    // generate-reports use both slots, so we chain the remaining
    // maintenance jobs off this one via QStash (which forwards the
    // Authorization header and gives us automatic retries):
    //   • refresh-health  — daily
    //   • prune-data       — weekly (Sundays, UTC)
    // Each runs in its own worker invocation, so neither is constrained
    // by this function's execution-time budget.
    const cronAuth = { Authorization: `Bearer ${env.CRON_SECRET}` };
    const followUps: Array<{ url: string; body: Record<string, never>; headers: Record<string, string> }> = [
      { url: `${env.APP_URL}/api/v1/cron/refresh-health`, body: {}, headers: cronAuth },
    ];
    if (new Date().getUTCDay() === 0) {
      followUps.push({ url: `${env.APP_URL}/api/v1/cron/prune-data`, body: {}, headers: cronAuth });
    }
    await Promise.all(followUps.map(f => qstash.publishJSON(f)));

    return NextResponse.json({ success: true, groupsEnqueued: groups.length, chained: followUps.map(f => f.url) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) || 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
