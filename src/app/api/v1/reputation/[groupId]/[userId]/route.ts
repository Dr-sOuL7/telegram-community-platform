import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../db/prisma';

export async function GET(req: NextRequest, { params }: { params: { groupId: string, userId: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { reputation: true, reputationLevel: true, warnings: true }
    });
    return NextResponse.json(user || { error: 'User not found' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
