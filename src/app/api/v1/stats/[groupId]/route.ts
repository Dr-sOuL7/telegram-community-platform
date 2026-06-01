import { NextRequest, NextResponse } from 'next/server';
import { analyticsRepo } from '../../../../../services/container';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const metrics = await analyticsRepo.getGroupMetrics(groupId);
    return NextResponse.json(metrics || { error: 'No metrics available yet' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
