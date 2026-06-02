import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../config/env';
import { telegramClient } from '../../../../lib/telegram/TelegramClient';

// One-time setup endpoint to register the bot's command menu with Telegram.
// Call this once: POST /api/v1/setup-commands with Authorization: Bearer <CRON_SECRET>
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const commands = [
      { command: 'start', description: '👋 Welcome message and bot introduction' },
      { command: 'help', description: '📖 List all available commands' },
      { command: 'ping', description: '🏓 Check if the bot is online' },
      { command: 'reputation', description: '⭐ View your reputation score' },
      { command: 'health', description: '❤️ View community health score' },
      { command: 'groupstats', description: '📊 View group statistics (admin)' },
      { command: 'summary', description: '🤖 AI summary of last 24h (admin)' },
      { command: 'ask', description: '💬 Ask the AI about your community (admin)' },
    ];

    await telegramClient.setMyCommands(commands);

    return NextResponse.json({ success: true, commandsRegistered: commands.length });
  } catch (error: any) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
