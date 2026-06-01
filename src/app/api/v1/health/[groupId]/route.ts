import { NextRequest, NextResponse } from 'next/server';
import { healthScoreService } from '../../../../../services/container';

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const health = await healthScoreService.getLatestScore(params.groupId);
    return NextResponse.json(health || { error: 'No health score available yet' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
