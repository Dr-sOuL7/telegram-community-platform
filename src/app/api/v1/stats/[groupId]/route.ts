import { NextRequest, NextResponse } from 'next/server';
import { analyticsRepo } from '../../../../../services/container';

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const metrics = await analyticsRepo.getGroupMetrics(params.groupId);
    return NextResponse.json(metrics || { error: 'No metrics available yet' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
