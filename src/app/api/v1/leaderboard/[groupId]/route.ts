import { NextRequest, NextResponse } from 'next/server';
import { reputationService } from '../../../../../services/container';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const leaderboard = await reputationService.getLeaderboard(groupId, 10);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
