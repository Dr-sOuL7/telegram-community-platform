import { NextRequest, NextResponse } from 'next/server';
import { reportRepo } from '../../../../../services/container';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const reports = await reportRepo.getReports(groupId, 10);
    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) || 'Internal Server Error' }, { status: 500 });
  }
}
