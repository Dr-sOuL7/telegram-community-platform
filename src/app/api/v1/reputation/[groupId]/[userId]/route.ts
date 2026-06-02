import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../db/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string, userId: string }> }) {
  try {
    const { userId } = await params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { reputation: true, reputationLevel: true, warnings: true }
    });
    return NextResponse.json(user || { error: 'User not found' });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) || 'Internal Server Error' }, { status: 500 });
  }
}
