import { registerCommand } from './registry';
import { reputationService, healthScoreService, reportService, analyticsRepo } from '../container';
import { telegramClient } from '../../lib/telegram/TelegramClient';
import { summarizationService, aiAssistantService } from '../container';

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
    await telegramClient.sendMessage(message.chat.id, `👤 ${message.from.first_name}, your reputation is being tracked. Use the dashboard API for exact numbers in Phase 2!`);
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
    
    await telegramClient.sendMessage(message.chat.id, `❤️ Community Health Score: ${score}/100`);
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
      await telegramClient.sendMessage(message.chat.id, 'No stats available yet.');
      return;
    }
    
    const text = `📊 **Group Stats**\nMessages: ${stats.totalMessages}\nCommands: ${stats.totalCommands}\nWarnings: ${stats.warningsIssued}\nBans: ${stats.bansIssued}`;
    await telegramClient.sendMessage(message.chat.id, text);
  }
});

registerCommand({
  name: 'summary',
  description: 'Get a summary of the group conversation for the last 24 hours',
  category: 'Moderation',
  adminOnly: true,
  usage: '/summary',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat) return;
    
    await telegramClient.sendMessage(message.chat.id, "🤖 Generating summary, this might take a moment...");
    
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const summary = await summarizationService.summarize(message.chat.id.toString(), yesterday, now);
      await telegramClient.sendMessage(message.chat.id, summary);
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to generate summary: ${e.message}`);
    }
  }
});

registerCommand({
  name: 'ask',
  description: 'Ask the AI assistant a question about the group',
  category: 'Moderation',
  adminOnly: true,
  usage: '/ask <question>',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat || !message.text) return;
    
    const parts = message.text.split(' ');
    if (parts.length < 2) {
      await telegramClient.sendMessage(message.chat.id, "Please provide a question. Usage: /ask <question>");
      return;
    }
    
    const question = parts.slice(1).join(' ');
    await telegramClient.sendMessage(message.chat.id, "🤖 Let me check...");
    
    try {
      const answer = await aiAssistantService.answerQuestion(message.chat.id.toString(), question);
      await telegramClient.sendMessage(message.chat.id, `🤖 **AI Assistant:**\n\n${answer}`);
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to get answer: ${e.message}`);
    }
  }
});
