import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../config/env';
import { telegramClient } from '../../../../lib/telegram/TelegramClient';
import { prisma } from '../../../../db/prisma';

// One-time setup endpoint to register the bot's command menu with Telegram.
// Call this once: POST /api/v1/setup-commands with Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminSession" (
          "userId" TEXT NOT NULL,
          "groupId" TEXT NOT NULL,
          "action" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("userId")
      );
    `);

    const commands = [
      { command: 'start', description: '👋 Welcome message and bot introduction' },
      { command: 'help', description: '📖 List all available commands' },
      { command: 'ping', description: '🏓 Check if the bot is online' },
      { command: 'settings', description: '⚙️ View current group bot settings (admin)' },
      { command: 'reputation', description: '⭐ View your reputation score' },
      { command: 'profile', description: '👤 View your community profile' },
      { command: 'health', description: '❤️ View community health score' },
      { command: 'groupstats', description: '📊 View group statistics (admin)' },
      { command: 'summary', description: '🤖 AI summary of last 24h (admin)' },
      { command: 'ask', description: '💬 Ask the AI about your community (admin)' },
      { command: 'ban', description: '🔨 Ban a user (admin, reply to message)' },
      { command: 'unban', description: '✅ Unban a user (admin, reply to message)' },
      { command: 'mute', description: '🔇 Mute a user for 1 hour (admin, reply to message)' },
      { command: 'unmute', description: '🔊 Unmute a user (admin, reply to message)' },
      { command: 'warn', description: '⚠️ Warn a user (admin, reply to message)' },
      { command: 'unwarn', description: '✅ Remove a warning (admin, reply to message)' },
      { command: 'delete', description: '🗑 Delete a message (admin, reply to message)' },
    ];

    await telegramClient.setMyCommands(commands);

    return NextResponse.json({ success: true, commandsRegistered: commands.length });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
