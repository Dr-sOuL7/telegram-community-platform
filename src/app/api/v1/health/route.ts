import { NextResponse } from 'next/server';
import { prisma } from '../../../../db/prisma';

export async function GET() {
  const requestId = crypto.randomUUID();
  let dbStatus = 'disconnected';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error: any) {
    dbStatus = 'error';
  }

  return NextResponse.json({
    status: 'ok',
    database: dbStatus,
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }, {
    headers: {
      'X-Request-ID': requestId,
      'X-App-Version': '1.0.0',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
