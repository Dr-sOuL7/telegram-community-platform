import { NextRequest, NextResponse } from 'next/server';
import { reportRepo } from '../../../../../services/container';

export async function GET(req: NextRequest, { params }: { params: { groupId: string } }) {
  try {
    const reports = await reportRepo.getReports(params.groupId, 10);
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
