import { registerCommand, commandRegistry } from './registry';
import { reputationService, healthScoreService, reportService, analyticsRepo } from '../container';
import { telegramClient } from '../../lib/telegram/TelegramClient';
import { summarizationService, aiAssistantService } from '../container';
import { env } from '../../config/env';

// ─── Core Commands ───────────────────────────────────────────────

registerCommand({
  name: 'start',
  description: 'Welcome message and bot introduction',
  category: 'Utility',
  adminOnly: false,
  usage: '/start',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat) return;

    const name = message.from?.first_name || 'there';
    const text = [
      `👋 Hey ${name}! Welcome to the Community Intelligence Bot.`,
      ``,
      `I help admins understand and manage their Telegram communities with:`,
      ``,
      `📊 Real-time analytics & group stats`,
      `⭐ Reputation tracking for members`,
      `❤️ Community health scoring`,
      `🤖 AI-powered summaries & insights`,
      `📝 Automated daily/weekly/monthly reports`,
      `🛡️ Moderation tools`,
      ``,
      `Type /help to see all available commands.`,
    ].join('\n');

    const botUsername = 'CommunityManager1Bot'; // Should ideally be fetched dynamically, but hardcoding for now

    await telegramClient.sendMessage(message.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌐 Visit Website", web_app: { url: `${env.APP_URL}` } }],
          [{ text: "🏆 Global Leaderboards", web_app: { url: `${env.APP_URL}/public/leaderboard` } }],
          [{ text: "➕ Add Bot to your Group", url: `https://t.me/${botUsername}?startgroup=true` }]
        ]
      }
    });
  }
});

registerCommand({
  name: 'help',
  description: 'List all available commands',
  category: 'Utility',
  adminOnly: false,
  usage: '/help',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat) return;

    const userCommands: string[] = [];
    const adminCommands: string[] = [];

    commandRegistry.forEach((cmd) => {
      const line = `/${cmd.name} — ${cmd.description}`;
      if (cmd.adminOnly) {
        adminCommands.push(line);
      } else {
        userCommands.push(line);
      }
    });

    const text = [
      `📖 Available Commands`,
      ``,
      `👤 Everyone:`,
      ...userCommands.map(c => `  ${c}`),
      ``,
      `🛡️ Admins Only:`,
      ...adminCommands.map(c => `  ${c}`),
      ``,
      `Tip: Use /ask <question> to chat with the AI about your community.`,
    ].join('\n');

    await telegramClient.sendMessage(message.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🌐 Full Command List Online", web_app: { url: `${env.APP_URL}/dashboard/commands` } }]
        ]
      }
    });
  }
});

registerCommand({
  name: 'ping',
  description: 'Check if the bot is online',
  category: 'Utility',
  adminOnly: false,
  usage: '/ping',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat) return;

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    await telegramClient.sendMessage(message.chat.id, `🏓 Pong! Bot is online.\n⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s`);
  }
});

// ─── Feature Commands ────────────────────────────────────────────
registerCommand({
  name: 'reputation',
  description: 'View your current reputation score',
  category: 'User',
  adminOnly: false,
  usage: '/reputation',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.from || !message.chat) return;
    
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
    const { message, internalGroupId } = ctx;
    if (!message.chat) return;
    
    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "This command can only be used in a group.");
      return;
    }
    
    const health = await healthScoreService.getLatestScore(internalGroupId);
    const score = health?.score || 'N/A';
    
    await telegramClient.sendMessage(message.chat.id, `❤️ Community Health Score: ${score}/100`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 View Public Analytics", web_app: { url: `${env.APP_URL}/public/groups/${internalGroupId}` } }]
        ]
      }
    });
  }
});

registerCommand({
  name: 'groupstats',
  description: 'View aggregate group statistics',
  category: 'Moderation',
  adminOnly: true,
  usage: '/groupstats',
  execute: async (ctx) => {
    const { message, internalGroupId } = ctx;
    if (!message.chat) return;
    
    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "This command can only be used in a group.");
      return;
    }
    
    const stats = await analyticsRepo.getGroupMetrics(internalGroupId);
    if (!stats) {
      await telegramClient.sendMessage(message.chat.id, 'No stats available yet.');
      return;
    }
    
    const text = `📊 **Group Stats**\nMessages: ${stats.totalMessages}\nCommands: ${stats.totalCommands}\nWarnings: ${stats.warningsIssued}\nBans: ${stats.bansIssued}`;
    await telegramClient.sendMessage(message.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 View Public Analytics", web_app: { url: `${env.APP_URL}/public/groups/${internalGroupId}` } }]
        ]
      }
    });
  }
});

registerCommand({
  name: 'summary',
  description: 'Get a summary of the group conversation for the last 24 hours',
  category: 'Moderation',
  adminOnly: true,
  usage: '/summary',
  execute: async (ctx) => {
    const { message, internalGroupId } = ctx;
    if (!message.chat) return;
    
    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "This command can only be used in a group.");
      return;
    }
    
    await telegramClient.sendMessage(message.chat.id, "🤖 Generating summary, this might take a moment...");
    
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const summary = await summarizationService.summarize(internalGroupId, yesterday, now);
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
    const { message, internalGroupId } = ctx;
    if (!message.chat || !message.text) return;
    
    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "This command can only be used in a group.");
      return;
    }
    
    const parts = message.text.split(' ');
    if (parts.length < 2) {
      await telegramClient.sendMessage(message.chat.id, "Please provide a question. Usage: /ask <question>");
      return;
    }
    
    const question = parts.slice(1).join(' ');
    await telegramClient.sendMessage(message.chat.id, "🤖 Let me check...");
    
    try {
      const answer = await aiAssistantService.answerQuestion(internalGroupId, question);
      await telegramClient.sendMessage(message.chat.id, `🤖 **AI Assistant:**\n\n${answer}`);
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to get answer: ${e.message}`);
    }
  }
});
