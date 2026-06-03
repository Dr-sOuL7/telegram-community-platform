import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../../config/env';
import { healthScoreService } from '../../../../../services/container';
import { prisma } from '../../../../../db/prisma';

// Vercel Cron invokes endpoints with GET; we also accept POST. Shared handler.
async function handle(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const groups = await prisma.group.findMany({ select: { id: true } });
    for (const group of groups) {
      await healthScoreService.calculateAndStoreHealth(group.id);
    }
    return NextResponse.json({ success: true, groupsProcessed: groups.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) || 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
