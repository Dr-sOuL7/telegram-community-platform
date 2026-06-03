import { registerCommand, commandRegistry } from './registry';
import { reputationService, healthScoreService, reportService, analyticsRepo, userRepo, moderationRepo, groupRepo } from '../container';
import { telegramClient } from '../../lib/telegram/TelegramClient';
import { summarizationService, aiAssistantService } from '../container';
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { logger } from '../../lib/logger/pino';

async function isUserAdmin(chatId: bigint | number, userId: bigint | number): Promise<boolean> {
  try {
    const member = await telegramClient.getChatMember(chatId, userId);
    return member.status === 'creator' || member.status === 'administrator';
  } catch {
    return false;
  }
}

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

    const botUsername = 'CommunityManager1Bot';

    const isPrivate = message.chat.type === 'private';
    const webAppUrl = `${env.APP_URL}`;
    const leaderboardUrl = `${env.APP_URL}/public/leaderboard`;

    await telegramClient.sendMessage(message.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [
            isPrivate 
              ? { text: "🌐 Visit Website", web_app: { url: webAppUrl } }
              : { text: "🌐 Visit Website", url: webAppUrl }
          ],
          [
            isPrivate
              ? { text: "🏆 Global Leaderboards", web_app: { url: leaderboardUrl } }
              : { text: "🏆 Global Leaderboards", url: leaderboardUrl }
          ],
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

    const isPrivate = message.chat.type === 'private';
    const commandsUrl = `${env.APP_URL}/dashboard/commands`;

    await telegramClient.sendMessage(message.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [
            isPrivate
              ? { text: "🌐 Full Command List Online", web_app: { url: commandsUrl } }
              : { text: "🌐 Full Command List Online", url: commandsUrl }
          ]
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

registerCommand({
  name: 'debug',
  description: 'Debug internal context',
  category: 'Utility',
  adminOnly: false,
  usage: '/debug',
  execute: async (ctx) => {
    const { message, internalGroupId, internalUserId } = ctx;
    if (!message.chat) return;

    let groupError = 'None';
    try {
      await groupRepo.upsert(
        BigInt(message.chat.id),
        message.chat.title || 'Unknown Group'
      );
    } catch (err: any) {
      groupError = err.message || err.toString();
    }

    const text = `🛠 Debug Info
chat.id: ${message.chat.id}
chat.type: ${message.chat.type}
internalGroupId: ${internalGroupId || 'UNDEFINED'}
internalUserId: ${internalUserId || 'UNDEFINED'}
upsertError: ${groupError}`;

    await telegramClient.sendMessage(message.chat.id, text);
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
      const user = await prisma.user.findUnique({ where: { id: internalUserId } });
      if (!user) return;
      
      await telegramClient.sendMessage(chatId, `👤 ${firstName}, your current reputation score is ${user.reputation}.`);
    } catch (e) {
      logger.error({ err: e, internalUserId }, 'Failed to fetch reputation');
    }
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
    
    const isPrivate = message.chat.type === 'private';
    const webAppUrl = `${env.APP_URL}/public/groups/${internalGroupId}`;

    await telegramClient.sendMessage(message.chat.id, `❤️ Community Health Score: ${score}/100`, {
      reply_markup: {
        inline_keyboard: [
          [
            isPrivate
              ? { text: "📊 View Public Analytics", web_app: { url: webAppUrl } }
              : { text: "📊 View Public Analytics", url: webAppUrl }
          ]
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
    if (!message.chat || !message.from) return;
    
    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "This command can only be used in a group.");
      return;
    }

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }
    
    const stats = await analyticsRepo.getGroupMetrics(internalGroupId);
    if (!stats) {
      await telegramClient.sendMessage(message.chat.id, 'No stats available yet.');
      return;
    }
    
    const text = `📊 Group Stats
Messages: ${stats.totalMessages}
Commands: ${stats.totalCommands}
Warnings: ${stats.warningsIssued}
Bans: ${stats.bansIssued}`;
    const isPrivate = message.chat.type === 'private';
    const webAppUrl = `${env.APP_URL}/public/groups/${internalGroupId}`;

    await telegramClient.sendMessage(message.chat.id, text, {
      reply_markup: {
        inline_keyboard: [
          [
            isPrivate
              ? { text: "📊 View Public Analytics", web_app: { url: webAppUrl } }
              : { text: "📊 View Public Analytics", url: webAppUrl }
          ]
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
    if (!message.chat || !message.from) return;
    
    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "This command can only be used in a group.");
      return;
    }

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
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
    if (!message.chat || !message.text || !message.from) return;
    
    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "This command can only be used in a group.");
      return;
    }

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
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
      await telegramClient.sendMessage(message.chat.id, `🤖 AI Assistant:\n\n${answer}`);
    } catch (e: any) {
      await telegramClient.sendMessage(message.chat.id, `❌ Failed to get answer: ${e.message}`);
    }
  }
});

// ─── Moderation Commands ─────────────────────────────────────────



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
  adminOnly: true,
  usage: '/ban [reason]',
  execute: async (ctx) => {
    const { message, internalGroupId, internalUserId } = ctx;
    if (!message.chat || !internalUserId || !message.from) return;

    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "❌ This command can only be used in a group.");
      return;
    }

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }

    const target = getTargetUser(message);
    if (!target) {
      await telegramClient.sendMessage(message.chat.id, "Please reply to a message from the user you want to ban.");
      return;
    }

    const reason = (message.text || '').split(' ').slice(1).join(' ') || 'No reason provided';

    try {
      // Critical: Execute the Telegram API ban
      await telegramClient.banChatMember(message.chat.id, target.id);
      await telegramClient.sendMessage(message.chat.id, `🔨 ${target.first_name} has been banned.\nReason: ${reason}`);
      
      // Critical: Log the moderation action to the database
      const targetUser = await userRepo.upsert(BigInt(target.id), { firstName: target.first_name, username: target.username });
      await moderationRepo.createAction({
        userId: targetUser.id,
        groupId: internalGroupId,
        moderatorId: internalUserId,
        actionType: 'BAN',
        reason
      });
    } catch (e: any) {
      logger.error({ err: e, internalGroupId }, 'Failed to ban user');
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
    if (!message.chat || !internalUserId || !message.from) return;

    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "❌ This command can only be used in a group.");
      return;
    }

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }

    const target = getTargetUser(message);
    if (!target) {
      await telegramClient.sendMessage(message.chat.id, "Please reply to a message from the user you want to mute.");
      return;
    }

    const reason = (message.text || '').split(' ').slice(1).join(' ') || 'No reason provided';
    const untilDate = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    try {
      await telegramClient.restrictChatMember(message.chat.id, target.id, { can_send_messages: false }, untilDate);
      await telegramClient.sendMessage(message.chat.id, `🔇 ${target.first_name} has been muted for 1 hour.\nReason: ${reason}`);
      
      const targetUser = await userRepo.upsert(BigInt(target.id), { firstName: target.first_name, username: target.username });
      await moderationRepo.createAction({
        userId: targetUser.id,
        groupId: internalGroupId,
        moderatorId: internalUserId,
        actionType: 'MUTE',
        reason
      });
    } catch (e: any) {
      logger.error({ err: e, internalGroupId }, 'Failed to mute user');
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
    if (!message.chat || !internalUserId || !message.from) return;

    if (!internalGroupId) {
      await telegramClient.sendMessage(message.chat.id, "❌ This command can only be used in a group.");
      return;
    }

    if (!(await isUserAdmin(message.chat.id, message.from.id))) {
      await telegramClient.sendMessage(message.chat.id, "❌ Only Telegram Group Admins can use this command.");
      return;
    }

    const target = getTargetUser(message);
    if (!target) {
      await telegramClient.sendMessage(message.chat.id, "Please reply to a message from the user you want to warn.");
      return;
    }

    const reason = (message.text || '').split(' ').slice(1).join(' ') || 'No reason provided';

    try {
      await telegramClient.sendMessage(message.chat.id, `⚠️ ${target.first_name}, you have been warned.\nReason: ${reason}`);
      
      const targetUser = await userRepo.upsert(BigInt(target.id), { firstName: target.first_name, username: target.username });
      await moderationRepo.createAction({
        userId: targetUser.id,
        groupId: internalGroupId,
        moderatorId: internalUserId,
        actionType: 'WARN',
        reason
      });
      
      // Increment warning count
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { warnings: { increment: 1 } }
      });
    } catch (e: any) {
      logger.error({ err: e, internalGroupId }, 'Failed to warn user');
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
      await telegramClient.deleteMessage(message.chat.id, message.message_id);
    } catch (e: any) {
      logger.error({ err: e }, 'Failed to delete message');
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
    if (!message.chat || !internalUserId) return;

    try {
      const user = await prisma.user.findUnique({ where: { id: internalUserId } });
      let msgs = 0;
      if (internalGroupId) {
        msgs = await prisma.message.count({ where: { userId: internalUserId, groupId: internalGroupId } });
      } else {
        msgs = await prisma.message.count({ where: { userId: internalUserId } });
      }
      
      if (!user) return;

      const text = `👤 Profile: ${user.firstName}\n\n` +
        `⭐ Reputation: ${user.reputation}\n` +
        `💬 Messages Sent${internalGroupId ? ' (This Group)' : ' (Global)'}: ${msgs}\n` +
        `⚠️ Warnings: ${user.warnings}\n\n` +
        `📅 Joined Network: ${user.joinedAt.toDateString()}`;
        
      const isPrivate = message.chat.type === 'private';
      const webAppUrl = `${env.APP_URL}/public/leaderboard`;

      await telegramClient.sendMessage(message.chat.id, text, {
        reply_markup: {
          inline_keyboard: [
            [
              isPrivate
                ? { text: "🏆 View Leaderboards", web_app: { url: webAppUrl } }
                : { text: "🏆 View Leaderboards", url: webAppUrl }
            ]
          ]
        }
      });
    } catch (e) {
      logger.error({ err: e, internalUserId, internalGroupId }, 'Failed to fetch profile');
    }
  }
});
