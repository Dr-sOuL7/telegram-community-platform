import { NextRequest, NextResponse } from 'next/server';
import { healthScoreService } from '../../../../../services/container';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const health = await healthScoreService.getLatestScore(groupId);
    return NextResponse.json(health || { error: 'No health score available yet' });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) || 'Internal Server Error' }, { status: 500 });
  }
}
