import { registerCommand } from './registry';
import { reputationService, healthScoreService, reportService, analyticsRepo } from '../container';
import { TelegramClient } from '../../lib/telegram/TelegramClient';
import { env } from '../../config/env';

const tgClient = new TelegramClient(env.BOT_TOKEN);

registerCommand({
  name: 'reputation',
  description: 'View your current reputation score',
  category: 'User',
  adminOnly: false,
  usage: '/reputation',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.from || !message.chat) return;
    
    // In a real app we'd fetch the DB, here we're demonstrating the integration
    // We would use a user repo, but for simplicity let's use a dummy value if missing
    await tgClient.sendMessage(message.chat.id, `👤 ${message.from.first_name}, your reputation is being tracked. Use the dashboard API for exact numbers in Phase 2!`);
  }
});

registerCommand({
  name: 'health',
  description: 'View the community health score',
  category: 'User',
  adminOnly: false,
  usage: '/health',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat) return;
    
    const health = await healthScoreService.getLatestScore(message.chat.id.toString());
    const score = health?.score || 'N/A';
    
    await tgClient.sendMessage(message.chat.id, `❤️ Community Health Score: ${score}/100`);
  }
});

registerCommand({
  name: 'groupstats',
  description: 'View aggregate group statistics',
  category: 'Moderation',
  adminOnly: true,
  usage: '/groupstats',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat) return;
    
    const stats = await analyticsRepo.getGroupMetrics(message.chat.id.toString());
    if (!stats) {
      await tgClient.sendMessage(message.chat.id, 'No stats available yet.');
      return;
    }
    
    const text = `📊 **Group Stats**\nMessages: ${stats.totalMessages}\nCommands: ${stats.totalCommands}\nWarnings: ${stats.warningsIssued}\nBans: ${stats.bansIssued}`;
    await tgClient.sendMessage(message.chat.id, text);
  }
});
