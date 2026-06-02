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
    const { message, internalUserId } = ctx;
    if (!message.from || !message.chat || !internalUserId) return;
    
    const firstName = message.from.first_name;
    const chatId = message.chat.id;

    try {
      import('../../db/prisma').then(async ({ prisma }) => {
        const user = await prisma.user.findUnique({ where: { id: internalUserId } });
        if (!user) return;
        
        await telegramClient.sendMessage(chatId, `👤 **${firstName}**, your current reputation score is **${user.reputation}**.`);
      });
    } catch (e) {}
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

// ─── Moderation Commands ─────────────────────────────────────────

async function isUserAdmin(chatId: bigint | number, userId: bigint | number): Promise<boolean> {
  try {
    const member = await telegramClient.getChatMember(chatId, userId);
    return member.status === 'creator' || member.status === 'administrator';
  } catch {
    return false;
  }
}

function getTargetUser(message: any) {
  if (message.reply_to_message?.from) {
    return message.reply_to_message.from;
  }
  return null;
}

registerCommand({
  name: 'ban',
  description: 'Ban a user from the group (Reply to their message)',
  category: 'Moderation',
  adminOnly: true, // Internal DB role check (we also verify natively below)
  usage: '/ban [reason]',
  execute: async (ctx) => {
    const { message, internalGroupId, internalUserId } = ctx;
    if (!message.chat || !internalGroupId || !internalUserId || !message.from) return;

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }

    const target = getTargetUser(message);
    if (!target) {
      await telegramClient.sendMessage(message.chat.id, "Please reply to a message from the user you want to ban.");
      return;
    }

    const reason = message.text.split(' ').slice(1).join(' ') || 'No reason provided';

    try {
      await telegramClient.banChatMember(message.chat.id, target.id);
      await telegramClient.sendMessage(message.chat.id, `🔨 **${target.first_name}** has been banned.\nReason: ${reason}`);
      
      import('../container').then(({ userRepo, moderationRepo }) => {
        userRepo.upsert(BigInt(target.id), { firstName: target.first_name, username: target.username }).then(targetUser => {
          moderationRepo.logAction({
            userId: targetUser.id,
            groupId: internalGroupId,
            moderatorId: internalUserId,
            actionType: 'BAN',
            reason
          });
        });
      });
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to ban: ${e.message}`);
    }
  }
});

registerCommand({
  name: 'mute',
  description: 'Mute a user (Reply to their message)',
  category: 'Moderation',
  adminOnly: true,
  usage: '/mute [reason]',
  execute: async (ctx) => {
    const { message, internalGroupId, internalUserId } = ctx;
    if (!message.chat || !internalGroupId || !internalUserId || !message.from) return;

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }

    const target = getTargetUser(message);
    if (!target) {
      await telegramClient.sendMessage(message.chat.id, "Please reply to a message from the user you want to mute.");
      return;
    }

    const reason = message.text.split(' ').slice(1).join(' ') || 'No reason provided';
    const untilDate = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    try {
      await telegramClient.restrictChatMember(message.chat.id, target.id, { can_send_messages: false }, untilDate);
      await telegramClient.sendMessage(message.chat.id, `🔇 **${target.first_name}** has been muted for 1 hour.\nReason: ${reason}`);
      
      import('../container').then(({ userRepo, moderationRepo }) => {
        userRepo.upsert(BigInt(target.id), { firstName: target.first_name, username: target.username }).then(targetUser => {
          moderationRepo.logAction({
            userId: targetUser.id,
            groupId: internalGroupId,
            moderatorId: internalUserId,
            actionType: 'MUTE',
            reason
          });
        });
      });
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to mute: ${e.message}`);
    }
  }
});

registerCommand({
  name: 'warn',
  description: 'Warn a user (Reply to their message)',
  category: 'Moderation',
  adminOnly: true,
  usage: '/warn [reason]',
  execute: async (ctx) => {
    const { message, internalGroupId, internalUserId } = ctx;
    if (!message.chat || !internalGroupId || !internalUserId || !message.from) return;

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }

    const target = getTargetUser(message);
    if (!target) {
      await telegramClient.sendMessage(message.chat.id, "Please reply to a message from the user you want to warn.");
      return;
    }

    const reason = message.text.split(' ').slice(1).join(' ') || 'No reason provided';

    try {
      await telegramClient.sendMessage(message.chat.id, `⚠️ **${target.first_name}**, you have been warned.\nReason: ${reason}`);
      
      import('../container').then(({ userRepo, moderationRepo, groupRepo }) => {
        userRepo.upsert(BigInt(target.id), { firstName: target.first_name, username: target.username }).then(async targetUser => {
          await moderationRepo.logAction({
            userId: targetUser.id,
            groupId: internalGroupId,
            moderatorId: internalUserId,
            actionType: 'WARN',
            reason
          });
          
          // Apply internal warning increment
          import('../../db/prisma').then(({ prisma }) => {
             prisma.user.update({
               where: { id: targetUser.id },
               data: { warnings: { increment: 1 } }
             }).catch(() => {});
          });
        });
      });
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to warn: ${e.message}`);
    }
  }
});

registerCommand({
  name: 'delete',
  description: 'Delete a message (Reply to it)',
  category: 'Moderation',
  adminOnly: true,
  usage: '/delete',
  execute: async (ctx) => {
    const { message } = ctx;
    if (!message.chat || !message.from) return;

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }

    if (!message.reply_to_message) {
      await telegramClient.sendMessage(message.chat.id, "Please reply to the message you want to delete.");
      return;
    }

    try {
      await telegramClient.deleteMessage(message.chat.id, message.reply_to_message.message_id);
      // Also delete the command message itself
      await telegramClient.deleteMessage(message.chat.id, message.message_id);
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to delete: ${e.message}`);
    }
  }
});

// ─── Profile & Reputation ────────────────────────────────────────

registerCommand({
  name: 'profile',
  description: 'View your comprehensive community profile',
  category: 'User',
  adminOnly: false,
  usage: '/profile',
  execute: async (ctx) => {
    const { message, internalGroupId, internalUserId } = ctx;
    if (!message.chat || !internalGroupId || !internalUserId) return;

    try {
      import('../../db/prisma').then(async ({ prisma }) => {
        const user = await prisma.user.findUnique({ where: { id: internalUserId } });
        const msgs = await prisma.message.count({ where: { userId: internalUserId, groupId: internalGroupId } });
        
        if (!user) return;

        const text = `👤 **Profile: ${user.firstName}**\n\n` +
          `⭐ Reputation: **${user.reputation}**\n` +
          `💬 Messages Sent: **${msgs}**\n` +
          `⚠️ Warnings: **${user.warnings}**\n\n` +
          `📅 Joined Network: ${user.joinedAt.toDateString()}`;
          
        await telegramClient.sendMessage(message.chat.id, text, {
          reply_markup: {
            inline_keyboard: [
              [{ text: "🏆 View Leaderboards", web_app: { url: `${env.APP_URL}/public/leaderboard` } }]
            ]
          }
        });
      });
    } catch (e) {
      // ignore
    }
  }
});
